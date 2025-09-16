import React, { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { characterAPI } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CharacterFiles {
  [folder: string]: string[];
}

interface VideoPlaylistProps {
  files: string[];
  baseURL: string;
  folder: string;
}

const VideoPlaylist: React.FC<VideoPlaylistProps> = ({ files, baseURL, folder }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [currentSrc, setCurrentSrc] = useState("");

  // Set initial source
  useEffect(() => {
    if (files.length > 0) {
      setCurrentSrc(`${baseURL}/${folder}/${files[0]}`);
      setPlaylistIndex(0);
    }
  }, [files, baseURL, folder]);

  // Handle source change and load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    const handleLoadedData = () => {
      video.play().catch((e) => console.error("Auto-play failed:", e));
      video.removeEventListener("loadeddata", handleLoadedData);
    };

    video.src = currentSrc;
    video.load();
    video.addEventListener("loadeddata", handleLoadedData);
  }, [currentSrc, playlistIndex]);

  // Handle ended event to switch to next video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || files.length <= 1) return;

    const handleEnded = () => {
      const nextIndex = (playlistIndex + 1) % files.length;
      setPlaylistIndex(nextIndex);
      setCurrentSrc(`${baseURL}/${folder}/${files[nextIndex]}`);
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [playlistIndex, files, baseURL, folder]);

  if (files.length === 0) {
    return <p className="text-gray-500 text-sm">No .mp4 files available.</p>;
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover rounded border"
      controls
      autoPlay
      muted
      preload="metadata"
    >
      Your browser does not support the video tag.
    </video>
  );
};

const ChangeModel = () => {
  const [characterList, setCharacterList] = useState<CharacterFiles>({});
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="min-h-screen min-w-screen p-2">
      <h1 className="text-2xl font-bold mb-4">
        Hapiken Model Change Interface
      </h1>
      {/* Render character list here once data is available */}
      {Object.keys(characterList).length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {Object.entries(characterList).map(([key, files]) => {
            const mp4Files = files.filter((file: string) =>
              file.endsWith(".mp4"),
            );
            return (
              <Label
                key={key}
                className="border p-4 rounded-lg aspect-[1/1.5] hover:bg-accent/50 flex flex-col items-start gap-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-white dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
              >
                <h2 className="font-semibold text-lg mb-2">{key} Models</h2>
                {mp4Files.length > 0 ? (
                  <VideoPlaylist files={mp4Files} baseURL={baseURL} folder={key} />
                ) : (
                  <p className="text-gray-500 text-sm">
                    No .mp4 files available.
                  </p>
                )}
                <Checkbox
                  id={key}
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                />
              </Label>
            );
          })}
        </div>
      ) : (
        <p>No characters available.</p>
      )}
    </div>
  );
};

export default ChangeModel;
