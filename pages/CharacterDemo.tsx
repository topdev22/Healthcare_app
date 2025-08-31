import React from 'react';
import CharacterGrowthDemo from '@/components/CharacterGrowthDemo';

export default function CharacterDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            キャラクター成長システム
          </h1>
          <p className="text-lg text-gray-600">
            健康ログの記録によってキャラクターが成長する様子をご覧ください
          </p>
        </div>
        <CharacterGrowthDemo />
      </div>
    </div>
  );
}
