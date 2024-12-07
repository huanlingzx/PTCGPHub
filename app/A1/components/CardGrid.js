'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CardGrid({ 
  cards, 
  isCollectionMode = false, 
  collection = {}, 
  updatingCards = new Set(),
  onUpdateQuantity
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500">没有找到符合条件的卡牌</div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div 
          key={card.id} 
          className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
        >
          <Link 
            href={`/A1/${card.localid}`}
            target="_blank"
            className="block"
          >
            <div className="aspect-[63/88] relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <Image
                src={`/cards/a1-${card.localid.padStart(3, '0')}.png`}
                alt={card.name}
                fill
                priority={index < 6}
                className={`object-cover ${isCollectionMode && !collection[card.id] ? 'grayscale' : ''}`}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
              {isCollectionMode && (
                <div 
                  className="absolute top-2 right-2 flex gap-1 bg-black bg-opacity-50 p-1 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    className={`text-white px-2 hover:bg-gray-700 rounded ${
                      updatingCards.has(card.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      const currentQuantity = collection[card.id] || 0;
                      if (currentQuantity > 0 && !updatingCards.has(card.id)) {
                        onUpdateQuantity(card.id, currentQuantity - 1);
                      }
                    }}
                    disabled={updatingCards.has(card.id)}
                  >
                    -
                  </button>
                  <span className="text-white min-w-[20px] text-center relative">
                    {collection[card.id] || 0}
                    {updatingCards.has(card.id) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    )}
                  </span>
                  <button
                    className={`text-white px-2 hover:bg-gray-700 rounded ${
                      updatingCards.has(card.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      const currentQuantity = collection[card.id] || 0;
                      if (!updatingCards.has(card.id)) {
                        onUpdateQuantity(card.id, currentQuantity + 1);
                      }
                    }}
                    disabled={updatingCards.has(card.id)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
            <div 
              className="opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 transition-opacity"
            >
              <p className="text-sm font-semibold">{card.name}</p>
              <p className="text-xs">
                {card.rarity} · {card.pack} · {card.category}
                {isCollectionMode && (
                  <span className="ml-2">
                    拥有: {collection[card.id] || 0}
                  </span>
                )}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
