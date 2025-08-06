import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button 
      className="fab pulse-soft"
      onClick={onClick}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}