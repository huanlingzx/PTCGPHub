'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CardDetail({ params }) {
  const resolvedParams = use(params);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchCard() {
      try {
        const response = await fetch(`/api/cards?id=${resolvedParams.id}`, {
          cache: 'force-cache'
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setCard(data.card);
          setQuantity(data.card.owned_quantity);
        }
      } catch (err) {
        setError('Failed to fetch card details');
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
  }, [resolvedParams.id]);

  const updateQuantity = async (newQuantity) => {
    if (updating) return;

    try {
      setUpdating(true);
      setQuantity(newQuantity);

      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId: card.id, quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setQuantity(quantity);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Card not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/A1"
          className="text-blue-500 hover:text-blue-600"
        >
          ← 返回列表
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：卡片图片 */}
        <div className="relative aspect-[63/88] rounded-lg overflow-hidden shadow-lg">
          <Image
            src={`/cards/a1-${resolvedParams.id.padStart(3, '0')}.png`}
            alt={card.name}
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* 右侧：卡片信息 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{card.name}</h1>
            <div className="space-y-2 text-gray-600">
              <p>稀有度: {card.rarity}</p>
              <p>卡包: {card.pack}</p>
              <p>类型: {card.category}</p>
              {card.details?.dexId && (
                <p>图鉴编号: #{String(card.details.dexId).padStart(3, '0')}</p>
              )}
            </div>
          </div>

          {/* 卡片详细信息 */}
          {card.details && (
            <div className="border-t pt-4">
              {card.category === 'Pokémon' ? (
                <div className="space-y-2">
                  {card.details.hp && <p><span className="font-medium">HP:</span> {card.details.hp}</p>}
                  {card.details.type && <p><span className="font-medium">属性:</span> {card.details.type}</p>}
                  {card.details.stage && <p><span className="font-medium">阶段:</span> {card.details.stage}</p>}
                </div>
              ) : card.category === 'Trainer' ? (
                <div className="space-y-2">
                  {card.details.trainerType && (
                    <p><span className="font-medium">训练家类型:</span> {card.details.trainerType}</p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* 收藏数量控制 */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">拥有数量:</span>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded border ${
                    updating ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => quantity > 0 && updateQuantity(quantity - 1)}
                  disabled={updating || quantity === 0}
                >
                  -
                </button>
                <span className="min-w-[40px] text-center">
                  {quantity}
                  {updating && (
                    <span className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  )}
                </span>
                <button
                  className={`px-3 py-1 rounded border ${
                    updating ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => updateQuantity(quantity + 1)}
                  disabled={updating}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
