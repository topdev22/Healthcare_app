import React from 'react';
import { Plus, Heart } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-50 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-health-green to-health-blue shadow-2xl hover:shadow-3xl group transition-all duration-300 ease-out hover:scale-110 active:scale-95 pulse-soft"
      onClick={onClick}
      title="健康データを記録"
    >
      <div className="relative flex items-center justify-center">
        {/* Background glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-health-green/30 to-health-blue/30 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
        
        {/* Main icon */}
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform group-hover:rotate-90 duration-300 relative z-10" />
        
        {/* Health indicator */}
        <Heart className="w-4 h-4 absolute -top-1 -right-1 text-white/90 group-hover:text-white transition-all duration-300 z-10 group-hover:scale-125" />
        
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-all duration-300"></div>
        <div className="absolute inset-2 rounded-full border border-white/20 group-hover:border-white/40 transition-all duration-300"></div>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        健康データを記録
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </button>
  );
}