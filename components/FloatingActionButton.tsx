import React from 'react';
import { Plus, Heart } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      className="fab pulse-soft group"
      onClick={onClick}
      title="健康データを記録"
    >
      <div className="relative">
        <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
        <Heart className="w-3 h-3 absolute -top-1 -right-1 text-white/80" />
      </div>
    </button>
  );
}