'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function PacksPage() {
  const [selectedPack, setSelectedPack] = useState(null);
  const [openingAnimation, setOpeningAnimation] = useState(false);
  const [openedCards, setOpenedCards] = useState(null);

  const PACK_TYPES = [
    { id: 'Pikachu', name: '皮卡丘卡包', image: '/packs/pikachu.png' },
    { id: 'Charizard', name: '喷火龙卡包', image: '/packs/charizard.png' },
    { id: 'Mewtwo', name: '超梦卡包', image: '/packs/mewtwo.png' }
  ];

  const handlePackSelect = (packId) => {
    setSelectedPack(packId);
    setOpenedCards(null);
  };

  const openPack = async () => {
    if (!selectedPack) return;

    setOpeningAnimation(true);

    try {
      const response = await fetch('/api/packs/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packType: selectedPack }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setTimeout(() => {
        setOpeningAnimation(false);
        setOpenedCards(data.cards);
      }, 2000);

    } catch (error) {
      alert('开包失败，请重试');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">

      <h1 className="text-3xl font-bold text-center mb-8">选择卡包</h1>

      <div className="flex justify-center gap-8 mb-8">
        {PACK_TYPES.map((pack, index) => (
          <div 
            key={pack.id}
            className={`cursor-pointer p-4 rounded-lg transition-transform hover:-translate-y-2 ${
              selectedPack === pack.id ? 'ring-4 ring-yellow-400' : ''
            }`}
            onClick={() => handlePackSelect(pack.id)}
          >
            <div className="relative w-[140px] h-[280px]">
              <Image 
                src={pack.image} 
                alt={pack.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="rounded-lg object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-center mt-4">{pack.name}</h3>
          </div>
        ))}
      </div>

      {selectedPack && (
        <button 
          className={`block mx-auto px-12 py-4 text-xl font-bold text-white rounded-lg transition-colors ${
            openingAnimation
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
          onClick={openPack}
          disabled={openingAnimation}
        >
          {openingAnimation ? '正在开包...' : '开包'}
        </button>
      )}

      {openingAnimation && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <div className="w-24 h-24 bg-yellow-400/50 rounded-full animate-pulse"></div>
        </div>
      )}

      {openedCards && openedCards.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">获得的卡片</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {openedCards.map((card, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="relative w-[150px] h-[209px] mx-auto">
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="rounded-lg object-contain"
                  />
                </div>
                <p className="mt-3 font-semibold">{card.name}</p>
                <p className="text-gray-600 text-sm mt-1">{card.rarity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
