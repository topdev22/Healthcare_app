import React, { useState, useEffect, useRef } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { characterAPI } from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";

interface CharacterFiles {
  [folder: string]: string[];
}

interface VideoPlaylistProps {
  files: string[];
  baseURL: string;
  folder: string;
}

const LottiePlaylist: React.FC<VideoPlaylistProps> = ({ files, baseURL, folder }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef(null);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [animationData, setAnimationData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const currentSrc = files.length > 0 ? `${baseURL}/${folder}/${files[playlistIndex]}` : "";

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch animation data when visible and currentSrc changes
  useEffect(() => {
    if (!isVisible || !currentSrc) return;

    fetch(currentSrc)
      .then((response) => response.json())
      .then((data) => {
        setAnimationData(data);
      })
      .catch((error) => {
        console.error("Failed to load Lottie animation:", error);
      });
  }, [currentSrc, isVisible]);

  useEffect(() => {
    if (files.length > 0) {
      setPlaylistIndex(0);
    }
  }, [files, baseURL, folder]);

  const handleComplete = () => {
    if (files.length > 1) {
      const nextIndex = (playlistIndex + 1) % files.length;
      setPlaylistIndex(nextIndex);
    }
  };

  if (files.length === 0) {
    return <p className="text-gray-500 text-sm">No .json files available.</p>;
  }

  return (
    <div ref={containerRef} className="w-full h-full rounded">
      {!animationData && isVisible ? (
        <div className="w-full h-full bg-gray-200 rounded border animate-pulse" />
      ) : !isVisible ? (
        <div className="w-full h-full bg-gray-200 rounded border animate-pulse" />
      ) : null}
      {animationData && (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={files.length <= 1}
          autoplay={true}
          className="w-full h-full object-cover rounded"
          onComplete={handleComplete}
        />
      )}
    </div>
  );
};

const ChangeModel = () => {
  const navigate = useNavigate();
  const [characterList, setCharacterList] = useState<CharacterFiles>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<string>("");
  const baseURL = "/templates";

  useEffect(() => {
    const fetchCharacterData = async () => {
      try {
        setIsLoading(true);
        const res = await characterAPI.getCharacterData();
        setCharacterList(res);
      } catch (error) {
        console.error("Failed to fetch character data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacterData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center health-bg">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Outer spinning ring */}
            <div className="w-20 h-20 border-4 border-health-green/30 border-t-health-green rounded-full animate-spin mx-auto"></div>
            {/* Inner spinning ring - counter rotation */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-health-blue/30 border-b-health-blue rounded-full animate-spin animate-reverse mx-auto"></div>
            {/* Center heart icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-health-green to-health-blue rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">
              キャラクターを読み込み中...
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-health-green rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-health-blue rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-wellness-amber rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen p-2 flex flex-col justify-center items-center gap-2">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">
        ハピケン モデル切り替えインターフェース
      </h1>
      {/* Render character list here once data is available */}
      {Object.keys(characterList).length > 0 ? (
        <>
          <RadioGroup
            value={selectedModel}
            className="flex overflow-x-auto snap-x snap-mandatory space-x-0 pb-4 md:pb-0 md:gap-4 md:space-x-0 md:grid md:grid-cols-3 lg:grid-cols-4 w-full scrollbar-hide"
          >
            {Object.entries(characterList).map(([key, files]) => {
              const jsonFiles = files.filter((file: string) =>
                file.endsWith(".json"),
              );
              return (
                <div key={key} className="flex-shrink-0 w-full snap-start md:w-auto md:flex-1 md:snap-none">
                  <Label
                    htmlFor={key}
                    className="relative group p-4 rounded-lg aspect-[1/1.5] hover:bg-accent/50 flex flex-col items-start gap-3 group-data-[state=checked]:border-health-blue-600 group-data-[state=checked]:bg-white dark:group-data-[state=checked]:border-health-blue-900 dark:group-data-[state=checked]:bg-health-blue-950 cursor-pointer"
                    onClick={() => {
                      setPendingItem(key);
                      setIsModalOpen(true);
                    }}
                  >
                    {/* <h2 className="font-semibold text-lg mb-2 bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent">{key} モデル</h2> */}
                    {jsonFiles.length > 0 ? (
                      <LottiePlaylist files={jsonFiles} baseURL={baseURL} folder={key} />
                    ) : (
                      <p className="text-center text-sm font-medium bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent mt-2">
                        利用可能な .json ファイルがありません。
                      </p>
                    )}
                    <RadioGroupItem
                      value={key}
                      id={key}
                      className="absolute right-1 bottom-1 data-[state=checked]:border-health-blue-600 data-[state=checked]:bg-health-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-health-blue-700 dark:data-[state=checked]:bg-health-blue-700"
                    />
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>設定の確認</DialogTitle>
                <DialogDescription>
                  このモデル「{pendingItem}」に切り替えますか？この設定を適用すると、キャラクターが変更されます。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => {
                  setSelectedModel(pendingItem);
                  setSelectedItem(pendingItem);
                  setIsModalOpen(false);
                  }}
                >
                  はい
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
    ) : (
      <p className="text-center text-lg font-medium bg-gradient-to-r from-health-green to-health-blue bg-clip-text text-transparent py-8">
        利用可能なキャラクターがありません。
      </p>
    )}
    <Button
      variant="outline"
      onClick={() => navigate(-1)}
      className="w-full max-w-sm bg-health-blue/10 border-health-blue text-health-blue hover:bg-health-blue/20 dark:bg-health-blue/20 dark:border-health-blue dark:text-health-blue dark:hover:bg-health-blue/30 flex items-center gap-2 mt-4"
    >
      <ArrowLeft className="w-4 h-4" />
      戻る
    </Button>
    </div>
  );
};

export default ChangeModel;
