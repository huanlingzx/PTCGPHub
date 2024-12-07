'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CardFilters from '../components/CardFilters';
import CardGrid from '../components/CardGrid';
import CollectionStats from '../components/CollectionStats';

export default function CollectionPage() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collection, setCollection] = useState({});
  const [updatingCards, setUpdatingCards] = useState(new Set());
  const [packStats, setPackStats] = useState(null);
  const [mewProgress, setMewProgress] = useState(null);
  const [filters, setFilters] = useState({
    rarity: '',
    pack: '',
    category: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.rarity) queryParams.append('rarity', filters.rarity);
      if (filters.pack) queryParams.append('pack', filters.pack);
      if (filters.category) queryParams.append('category', filters.category);

      const [cardsResponse, collectionResponse, statsResponse] = await Promise.all([
        fetch(`/api/cards?${queryParams}`, {
          cache: 'force-cache'
        }),
        fetch('/api/collection', {
          cache: 'force-cache'
        }),
        fetch('/api/stats', {
          cache: 'force-cache'
        })
      ]);

      const [cardsData, collectionData, statsData] = await Promise.all([
        cardsResponse.json(),
        collectionResponse.json(),
        statsResponse.json()
      ]);
      
      if (cardsData.error) {
        setError(cardsData.error);
        setCards([]);
      } else {
        setCards(cardsData.cards || []);
        setError(null);
      }

      if (!collectionData.error) {
        const collectionMap = {};
        collectionData.collection.forEach(item => {
          collectionMap[item.card_id] = item.quantity;
        });
        setCollection(collectionMap);
      }

      if (!statsData.error) {
        setPackStats(statsData.packStats);
        setMewProgress(statsData.mewProgress);
      }
    } catch (err) {
      setError('Failed to fetch data');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCardQuantity = async (cardId, newQuantity) => {
    if (updatingCards.has(cardId)) return;

    try {
      setCollection(prev => ({
        ...prev,
        [cardId]: newQuantity
      }));

      setUpdatingCards(prev => new Set(prev).add(cardId));

      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId, quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      // 更新成功后刷新统计数据
      const statsResponse = await fetch('/api/stats');
      const statsData = await statsResponse.json();
      if (!statsData.error) {
        setPackStats(statsData.packStats);
        setMewProgress(statsData.mewProgress);
      }

      setUpdatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      setCollection(prev => ({
        ...prev,
        [cardId]: prev[cardId] || 0
      }));
      setUpdatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">收藏管理</h1>
        <button
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          onClick={() => router.push('/A1/browse')}
        >
          切换到浏览模式
        </button>
      </div>

      <CollectionStats 
        packStats={packStats} 
        mewProgress={mewProgress}
      />

      <CardFilters
        filters={filters}
        onFilterChange={setFilters}
      />

      <CardGrid
        cards={cards}
        isCollectionMode={true}
        collection={collection}
        updatingCards={updatingCards}
        onUpdateQuantity={updateCardQuantity}
      />
    </div>
  );
}
