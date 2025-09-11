// Android/Capacitor utility functions for better mobile compatibility

export const isAndroidApp = (): boolean => {
  return typeof window !== 'undefined' && window.location.protocol === 'capacitor:';
};

export const isCapacitorApp = (): boolean => {
  return typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    // @ts-ignore - Capacitor global
    (typeof window.Capacitor !== 'undefined')
  );
};

export const getNetworkStatus = async (): Promise<boolean> => {
  if (isCapacitorApp()) {
    try {
      // @ts-ignore - Capacitor Network plugin
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return status.connected;
    } catch (error) {
      console.warn('Network status check failed:', error);
      return navigator.onLine;
    }
  }
  return navigator.onLine;
};

export const handleAndroidApiError = (error: any): string => {
  console.error('Android API Error:', error);
  
  if (!navigator.onLine) {
    return 'インターネット接続を確認してください。';
  }
  
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'リクエストがタイムアウトしました。再試行してください。';
  }
  
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
    return 'ネットワークエラーが発生しました。接続を確認して再試行してください。';
  }
  
  if (error.response?.status === 401) {
    return '認証エラーです。再ログインしてください。';
  }
  
  if (error.response?.status === 403) {
    return 'アクセス権限がありません。';
  }
  
  if (error.response?.status === 404) {
    return 'リクエストされたリソースが見つかりません。';
  }
  
  if (error.response?.status >= 500) {
    return 'サーバーエラーが発生しました。しばらくしてから再試行してください。';
  }
  
  return error.message || 'エラーが発生しました。再試行してください。';
};

export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const networkStatus = await getNetworkStatus();
      if (!networkStatus) {
        throw new Error('ネットワーク接続がありません');
      }
      
      return await apiCall();
    } catch (error) {
      console.warn(`API call attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying, with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

export const logAndroidError = (context: string, error: any) => {
  const errorDetails = {
    context,
    timestamp: new Date().toISOString(),
    isAndroid: isAndroidApp(),
    userAgent: navigator.userAgent,
    onLine: navigator.onLine,
    error: {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      stack: error.stack
    }
  };
  
  console.error('Android App Error:', errorDetails);
  
  // Store error for debugging
  try {
    const existingErrors = JSON.parse(localStorage.getItem('android_errors') || '[]');
    existingErrors.push(errorDetails);
    // Keep only last 10 errors
    if (existingErrors.length > 10) {
      existingErrors.splice(0, existingErrors.length - 10);
    }
    localStorage.setItem('android_errors', JSON.stringify(existingErrors));
  } catch (e) {
    console.warn('Failed to store error log:', e);
  }
};