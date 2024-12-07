'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CardFilters from '../components/CardFilters';
import CardGrid from '../components/CardGrid';

export default function BrowsePage() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    rarity: '',
    pack: '',
    category: '',
  });

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.rarity) queryParams.append('rarity', filters.rarity);
      if (filters.pack) queryParams.append('pack', filters.pack);
      if (filters.category) queryParams.append('category', filters.category);

      const response = await fetch(`/api/cards?${queryParams}`, {
        cache: 'force-cache'
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setCards([]);
      } else {
        setCards(data.cards || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

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
        <h1 className="text-2xl font-bold">浏览卡牌</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => router.push('/A1/collection')}
        >
          切换到收藏模式
        </button>
      </div>

      <CardFilters
        filters={filters}
        onFilterChange={setFilters}
      />

      <CardGrid
        cards={cards}
      />
    </div>
  );
}
