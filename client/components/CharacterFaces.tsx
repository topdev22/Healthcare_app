import React from 'react';

interface CharacterFaceProps {
  mood: 'happy' | 'neutral' | 'sad' | 'sleeping';
  size?: number;
  className?: string;
}

export default function CharacterFace({ mood, size = 64, className = "" }: CharacterFaceProps) {
  const renderFace = () => {
    switch (mood) {
      case 'happy':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="#FFE4B5" stroke="#DEB887" strokeWidth="2"/>
            {/* 目 */}
            <circle cx="35" cy="35" r="3" fill="#2C3E50"/>
            <circle cx="65" cy="35" r="3" fill="#2C3E50"/>
            {/* 頬の赤み */}
            <circle cx="25" cy="50" r="8" fill="#FFB6C1" opacity="0.6"/>
            <circle cx="75" cy="50" r="8" fill="#FFB6C1" opacity="0.6"/>
            {/* 笑顔 */}
            <path d="M 30 60 Q 50 75 70 60" stroke="#2C3E50" strokeWidth="2" fill="none"/>
          </svg>
        );
      
      case 'neutral':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="#F5DEB3" stroke="#DEB887" strokeWidth="2"/>
            {/* 目 */}
            <circle cx="35" cy="35" r="3" fill="#2C3E50"/>
            <circle cx="65" cy="35" r="3" fill="#2C3E50"/>
            {/* 口 */}
            <line x1="40" y1="60" x2="60" y2="60" stroke="#2C3E50" strokeWidth="2"/>
          </svg>
        );
      
      case 'sad':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="#E6E6FA" stroke="#DEB887" strokeWidth="2"/>
            {/* 目 */}
            <circle cx="35" cy="35" r="3" fill="#2C3E50"/>
            <circle cx="65" cy="35" r="3" fill="#2C3E50"/>
            {/* 涙 */}
            <circle cx="30" cy="45" r="2" fill="#87CEEB"/>
            <circle cx="70" cy="45" r="2" fill="#87CEEB"/>
            {/* 悲しい口 */}
            <path d="M 30 70 Q 50 55 70 70" stroke="#2C3E50" strokeWidth="2" fill="none"/>
          </svg>
        );
      
      case 'sleeping':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="#F0F8FF" stroke="#DEB887" strokeWidth="2"/>
            {/* 閉じた目 */}
            <path d="M 30 35 Q 35 30 40 35" stroke="#2C3E50" strokeWidth="2" fill="none"/>
            <path d="M 60 35 Q 65 30 70 35" stroke="#2C3E50" strokeWidth="2" fill="none"/>
            {/* 口 */}
            <ellipse cx="50" cy="60" rx="5" ry="3" fill="#2C3E50"/>
            {/* Zzz */}
            <text x="75" y="25" fontSize="12" fill="#87CEEB" fontFamily="serif">Z</text>
            <text x="80" y="20" fontSize="10" fill="#87CEEB" fontFamily="serif">z</text>
            <text x="85" y="15" fontSize="8" fill="#87CEEB" fontFamily="serif">z</text>
          </svg>
        );
      
      default:
        return renderFace();
    }
  };

  return renderFace();
}

// アイコン用のSVGコンポーネント群
export const HealthIcons = {
  Heart: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
    </svg>
  ),
  
  Scale: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L8 6v6h8V6l-4-4zM8 14v6l4 2 4-2v-6H8z" fill="currentColor"/>
    </svg>
  ),
  
  Smile: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2"/>
      <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  
  Camera: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  
  Trophy: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 22h16" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.25 18.75 14 20 14 20s1.75-1.25 3.03-1.79c.5-.23.97-.66.97-1.21v-2.34c0-1.06-.43-2.08-1.2-2.83L14 9.83c-.38-.38-.89-.6-1.41-.6H11.4c-.52 0-1.03.22-1.41.6L7.2 11.83C6.43 12.58 6 13.6 6 14.66z" fill="currentColor"/>
    </svg>
  ),
  
  Sparkles: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor"/>
      <path d="M5 5l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="currentColor"/>
      <path d="M19 19l-1-3-3-1 3-1 1-3 1 3 3 1-3 1z" fill="currentColor"/>
    </svg>
  ),
  
  Fire: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8.5 12.5l1.5-4.5c1-1 3-1 4 0l1.5 4.5M12 18.5a6.5 6.5 0 1 1 0-13c1.5 2 1.5 4.5 0 6.5z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.6"/>
    </svg>
  )
};

// 気分表示用のSVGアイコン
export const MoodIcons = {
  excited: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
      <circle cx="8" cy="9" r="1.5" fill="#FF4500"/>
      <circle cx="16" cy="9" r="1.5" fill="#FF4500"/>
      <path d="M7 13s2 3 5 3 5-3 5-3" stroke="#FF4500" strokeWidth="2" fill="none"/>
      <path d="M12 2l1 2M12 20l1 2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12l2 0M20 12l2 0M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#FFA500" strokeWidth="1"/>
    </svg>
  ),
  
  happy: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#98FB98" stroke="#32CD32" strokeWidth="2"/>
      <circle cx="8" cy="9" r="1.5" fill="#228B22"/>
      <circle cx="16" cy="9" r="1.5" fill="#228B22"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#228B22" strokeWidth="2" fill="none"/>
    </svg>
  ),
  
  neutral: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#F0F0F0" stroke="#808080" strokeWidth="2"/>
      <circle cx="8" cy="9" r="1.5" fill="#404040"/>
      <circle cx="16" cy="9" r="1.5" fill="#404040"/>
      <line x1="8" y1="14" x2="16" y2="14" stroke="#404040" strokeWidth="2"/>
    </svg>
  ),
  
  anxious: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#FFE4B5" stroke="#FFA500" strokeWidth="2"/>
      <circle cx="8" cy="9" r="1.5" fill="#B8860B"/>
      <circle cx="16" cy="9" r="1.5" fill="#B8860B"/>
      <path d="M8 16s1.5-1 4-1 4 1 4 1" stroke="#B8860B" strokeWidth="2" fill="none"/>
      <path d="M6 6l2 2M16 6l2 2" stroke="#FFA500" strokeWidth="1"/>
    </svg>
  ),
  
  sad: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#ADD8E6" stroke="#4682B4" strokeWidth="2"/>
      <circle cx="8" cy="9" r="1.5" fill="#191970"/>
      <circle cx="16" cy="9" r="1.5" fill="#191970"/>
      <path d="M8 16s1.5-2 4-2 4 2 4 2" stroke="#191970" strokeWidth="2" fill="none"/>
      <circle cx="7" cy="12" r="1" fill="#87CEEB"/>
      <circle cx="17" cy="12" r="1" fill="#87CEEB"/>
    </svg>
  )
};
