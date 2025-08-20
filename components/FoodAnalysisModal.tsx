import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Loader2, Check, X, RotateCcw, Wifi, WifiOff, AlertCircle, Monitor, Smartphone, Settings } from 'lucide-react';
import { healthAPI } from '@/lib/api';
import Webcam from 'react-webcam';

interface FoodAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFoodData: (data: FoodAnalysisResult) => void;
}

interface FoodAnalysisResult {
  foodItems: Array<{
    name: string;
    calories: number;
    confidence: number;
  }>;
  totalCalories: number;
  imageUrl: string;
}

type CameraStatus = 'connecting' | 'connected' | 'error' | 'permission-denied' | 'not-supported';
type Environment = 'mobile' | 'desktop' | 'tablet';

export default function FoodAnalysisModal({ isOpen, onClose, onSaveFoodData }: FoodAnalysisModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('connecting');
  const [cameraError, setCameraError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [environment, setEnvironment] = useState<Environment>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isMediaDevicesSupported, setIsMediaDevicesSupported] = useState<boolean | null>(null);

  // Cleanup function for media streams
  const cleanupStream = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
  }, [currentStream]);

  // Cleanup on unmount or modal close
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  // Handle device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      if (isCameraOpen) {
        // Re-enumerate devices when device list changes
        // This will be handled by the getAvailableCameras function when it's defined
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [isCameraOpen]);

  // Detect system environment
  useEffect(() => {
    const detectEnvironment = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?=.*\b(?!.*mobile))/i.test(userAgent);
      
      if (isTablet) {
        setEnvironment('tablet');
        setIsMobile(true);
      } else if (isMobileDevice) {
        setEnvironment('mobile');
        setIsMobile(true);
      } else {
        setEnvironment('desktop');
        setIsMobile(false);
      }
    };

    detectEnvironment();
  }, []);

  // Check browser compatibility
  useEffect(() => {
    const checkMediaDevicesSupport = () => {
      const isSupported = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        navigator.mediaDevices.enumerateDevices
      );
      setIsMediaDevicesSupported(isSupported);
      
      if (!isSupported) {
        console.warn('MediaDevices API not supported in this browser/environment');
      }
    };

    checkMediaDevicesSupport();
  }, []);

  // Get list of cameras - with improved error handling and fallbacks
  const getAvailableCameras = useCallback(async () => {
    // Check if MediaDevices API is supported
    if (!isMediaDevicesSupported) {
      setCameraStatus('not-supported');
      setCameraError('お使いのブラウザではカメラ機能がサポートされていません。ファイルアップロード機能をご利用ください。');
      return;
    }

    try {
      // Request camera permission first to get labeled devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        } 
      });
      
      // Store the stream for cleanup
      setCurrentStream(stream);
      
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(d => d.kind === "videoinput");
      
      setDevices(videoDevices);
      
      if (videoDevices.length > 0) {
        // Auto-select best camera based on environment
        let preferredDevice: MediaDeviceInfo | undefined;
        
        if (isMobile) {
          // On mobile, prefer back camera for food photos
          preferredDevice = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('環境') ||
            device.label.toLowerCase().includes('背面')
          );
        } else {
          // On desktop, prefer external camera if available
          preferredDevice = videoDevices.find(device => 
            device.label.toLowerCase().includes('external') ||
            device.label.toLowerCase().includes('usb') ||
            device.label.toLowerCase().includes('外付け') ||
            device.label.toLowerCase().includes('外部')
          );
        }
        
        const deviceId = preferredDevice?.deviceId || videoDevices[0].deviceId;
        setSelectedDeviceId(deviceId);
        
        // Test the selected device
        await testCameraDevice(deviceId);
      } else {
        setCameraStatus('error');
        setCameraError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
      }
    } catch (error) {
      console.error('Camera enumeration failed:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
          setCameraStatus('permission-denied');
          setCameraError('カメラの使用許可が必要です。ブラウザの設定でカメラを許可してください。');
        } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
          setCameraStatus('error');
          setCameraError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
        } else if (error.message.includes('not implemented') || error.message.includes('not supported')) {
          setCameraStatus('not-supported');
          setCameraError('お使いのブラウザではカメラ機能がサポートされていません。ファイルアップロード機能をご利用ください。');
        } else {
          setCameraStatus('error');
          setCameraError('カメラの接続に失敗しました。ファイルアップロード機能をご利用ください。');
        }
      } else {
        setCameraStatus('error');
        setCameraError('カメラの接続に失敗しました。ファイルアップロード機能をご利用ください。');
      }
    }
  }, [isMobile, isMediaDevicesSupported, cleanupStream]);

  // Test camera device before using it
  const testCameraDevice = useCallback(async (deviceId: string) => {
    try {
      setCameraStatus('connecting');
      
      // Cleanup previous stream
      cleanupStream();
      
      // Test the device with fallback constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: isMobile ? 1920 : 1280, min: 640 },
          height: { ideal: isMobile ? 1080 : 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });
      
      setCurrentStream(stream);
      setCameraStatus('connected');
      setCameraError('');
    } catch (error) {
      console.error('Camera device test failed:', error);
      
      // Try with more relaxed constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { min: 320 },
            height: { min: 240 }
          }
        });
        
        setCurrentStream(fallbackStream);
        setCameraStatus('connected');
        setCameraError('');
      } catch (fallbackError) {
        console.error('Fallback camera test failed:', fallbackError);
        setCameraStatus('error');
        setCameraError('選択されたカメラで接続できませんでした。別のカメラを試してください。');
      }
    }
  }, [isMobile, cleanupStream]);

  // Handle device changes after getAvailableCameras is defined
  useEffect(() => {
    const handleDeviceChange = () => {
      if (isCameraOpen) {
        // Re-enumerate devices when device list changes
        getAvailableCameras();
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [isCameraOpen, getAvailableCameras]);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
      setAnalysisResult(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const analyzeFoodImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // バックエンドAPI経由で食事画像を解析
      const result = await healthAPI.analyzeFoodImage(selectedImage);

      if (result.success && result.data) {
        const analysisResult: FoodAnalysisResult = {
          foodItems: result.data.foodItems || [],
          totalCalories: result.data.totalCalories || 0,
          imageUrl: imagePreview
        };
        
        setAnalysisResult(analysisResult);
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('食事画像解析エラー:', err);
      setError('画像の解析に失敗しました。別の画像を試してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (analysisResult) {
      onSaveFoodData(analysisResult);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview('');
    setAnalysisResult(null);
    setError('');
    setIsCameraOpen(false);
    setCameraStatus('connecting');
    setCameraError('');
    setShowCameraSelector(false);
    cleanupStream();
    onClose();
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    setCameraStatus('connecting');
    setCameraError('');
    
    try {
      // Get available cameras when opening camera
      await getAvailableCameras();
    } catch (error) {
      console.error('Failed to open camera:', error);
      setCameraStatus('error');
      setCameraError('カメラの初期化に失敗しました。ページを再読み込みしてから再試行してください。');
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    setCameraStatus('connecting');
    setCameraError('');
    setShowCameraSelector(false);
    cleanupStream();
  };

  const handleCameraConnected = () => {
    setCameraStatus('connected');
    setCameraError('');
  };

  const handleCameraError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    cleanupStream();
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        setCameraStatus('permission-denied');
        setCameraError('カメラの使用許可が必要です。ブラウザの設定でカメラを許可してください。');
      } else if (error.name === 'NotFoundError') {
        setCameraStatus('error');
        setCameraError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
      } else if (error.name === 'NotReadableError') {
        setCameraStatus('error');
        setCameraError('カメラが他のアプリケーションで使用中です。他のアプリを閉じてから再試行してください。');
      } else if (error.name === 'OverconstrainedError') {
        setCameraStatus('error');
        setCameraError('カメラの設定が対応していません。別のカメラを試してください。');
      } else {
        setCameraStatus('error');
        setCameraError('カメラの接続に失敗しました。');
      }
    } else {
      setCameraStatus('error');
      setCameraError('カメラの接続に失敗しました。');
    }
  };

  // Capture and process image - simplified approach from reference code
  const captureImage = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    try {
      // Convert Base64 → Blob (common for API upload)
      const blob = await fetch(imageSrc).then(res => res.blob());
      
      // Create File object from blob
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      handleFileSelect(file);
      setIsCameraOpen(false);
    } catch (err) {
      console.error('Error converting image:', err);
      setError('画像の処理に失敗しました。');
    }
  };

  const toggleCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      if (nextDevice) {
        testCameraDevice(nextDevice.deviceId);
      }
    }
  };

  const selectCamera = (deviceId: string) => {
    testCameraDevice(deviceId);
    setShowCameraSelector(false);
  };

  const openFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getCameraTypeLabel = (device: MediaDeviceInfo) => {
    const label = device.label.toLowerCase();
    if (isMobile) {
      if (label.includes('back') || label.includes('rear') || label.includes('環境') || label.includes('背面')) {
        return '背面';
      }
      if (label.includes('front') || label.includes('user') || label.includes('前面') || label.includes('前')) {
        return '前面';
      }
      return 'カメラ';
    } else {
      if (label.includes('external') || label.includes('usb') || label.includes('外付け') || label.includes('外部')) {
        return '外付け';
      }
      if (label.includes('built-in') || label.includes('内蔵') || label.includes('internal')) {
        return '内蔵';
      }
      if (label.includes('front') || label.includes('user') || label.includes('前面') || label.includes('前')) {
        return '前面';
      }
      return 'カメラ';
    }
  };

  const renderCameraStatus = () => {
    switch (cameraStatus) {
      case 'connecting':
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-600">カメラに接続中...</p>
              <p className="text-xs text-gray-500 mt-1">
                {environment === 'mobile' ? 'モバイル環境' : environment === 'tablet' ? 'タブレット環境' : 'デスクトップ環境'}
              </p>
              {selectedDeviceId && (
                <p className="text-xs text-gray-400 mt-1">
                  デバイス: {devices.find(d => d.deviceId === selectedDeviceId)?.label || 'カメラ'}
                </p>
              )}
            </div>
          </div>
        );
      case 'connected':
        return (
          <div className="relative">
            {selectedDeviceId && (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  deviceId: { exact: selectedDeviceId },
                  width: { ideal: isMobile ? 1920 : 1280, min: 640, max: 1920 },
                  height: { ideal: isMobile ? 1080 : 720, min: 480, max: 1080 },
                  frameRate: { ideal: 30, min: 15, max: 60 },
                  aspectRatio: { ideal: 16/9, min: 4/3, max: 21/9 }
                }}
                onUserMedia={handleCameraConnected}
                onUserMediaError={handleCameraError}
                className="w-full h-64 object-cover rounded-lg"
                mirrored={false}
                audio={false}
              />
            )}
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              接続済み
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                {isMobile ? 'モバイル' : 'PC'}
              </div>
              {devices.length > 1 && (
                <Button
                  onClick={() => setShowCameraSelector(!showCameraSelector)}
                  size="sm"
                  variant="outline"
                  className="bg-white/90"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={toggleCamera}
                size="sm"
                variant="outline"
                className="bg-white/90"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {devices.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {devices.length}台のカメラ
              </div>
            )}
            
            {/* Camera selector dropdown */}
            {showCameraSelector && devices.length > 1 && (
              <div className="absolute top-12 right-2 bg-white border rounded-lg shadow-lg p-2 min-w-48 z-10">
                <p className="text-xs font-medium text-gray-700 mb-2">カメラを選択</p>
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => selectCamera(device.deviceId)}
                    className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 ${
                      device.deviceId === selectedDeviceId ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-3 h-3" />
                      <span>{device.label || `カメラ ${device.deviceId.slice(0, 8)}`}</span>
                      <span className="text-gray-500">({getCameraTypeLabel(device)})</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'permission-denied':
        return (
          <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center">
              <WifiOff className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-medium text-red-700 mb-1">カメラの許可が必要</p>
              <p className="text-xs text-red-600">{cameraError}</p>
            </div>
          </div>
        );
      case 'not-supported':
        return (
          <div className="flex items-center justify-center h-64 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium text-yellow-700 mb-1">カメラ機能がサポートされていません</p>
              <p className="text-xs text-yellow-600 mb-4">{cameraError}</p>
              <Button
                onClick={openFileSelect}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                ファイルから選択
              </Button>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-medium text-red-700 mb-1">カメラエラー</p>
              <p className="text-xs text-red-600 mb-4">{cameraError}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={openCamera}
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  再試行
                </Button>
                <Button
                  onClick={openFileSelect}
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  ファイルから選択
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-health-green" />
            食事を記録
          </DialogTitle>
          <DialogDescription>
            写真を撮影または選択して、カロリーを自動計算します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isCameraOpen ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  {renderCameraStatus()}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeCamera}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  キャンセル
                </Button>
                
                <Button
                  onClick={captureImage}
                  disabled={cameraStatus !== 'connected'}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  撮影
                </Button>
              </div>
            </div>
          ) : !selectedImage ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={openCamera}
                  variant="outline"
                  className="h-24 flex flex-col items-center gap-2"
                  disabled={isMediaDevicesSupported === false}
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">カメラで撮影</span>
                  {isMediaDevicesSupported === false && (
                    <span className="text-xs text-gray-500">非対応</span>
                  )}
                </Button>
                
                <Button
                  onClick={openFileSelect}
                  variant="outline"
                  className="h-24 flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">ギャラリーから選択</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 画像プレビュー */}
              <Card>
                <CardContent className="p-4">
                  <img
                    src={imagePreview}
                    alt="選択された食事画像"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>

              {/* エラー表示 */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* 解析結果 */}
              {analysisResult && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-health-green" />
                      解析結果
                    </h3>
                    
                    <div className="space-y-2">
                      {analysisResult.foodItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center font-semibold">
                        <span>合計カロリー</span>
                        <span className="text-lg text-health-green">
                          {analysisResult.totalCalories} kcal
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                    setAnalysisResult(null);
                    setError('');
                  }}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  画像を変更
                </Button>
                
                {!analysisResult ? (
                  <Button
                    onClick={analyzeFoodImage}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        解析中...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        解析開始
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleSave} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    記録を保存
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
