'use client';

const RARITY_OPTIONS = [
  { value: '', label: '全部稀有度' },
  { value: '◊', label: 'One Diamond' },
  { value: '◊◊', label: 'Two Diamonds' },
  { value: '◊◊◊', label: 'Three Diamonds' },
  { value: '◊◊◊◊', label: 'Four Diamonds' },
  { value: '☆', label: 'One Star' },
  { value: '☆☆', label: 'Two Stars' },
  { value: '☆☆☆', label: 'Three Stars' },
  { value: 'Crown Rare', label: 'Crown Rare' },
];

const PACK_OPTIONS = [
  { value: '', label: '全部卡包' },
  { value: 'Pikachu', label: '皮卡丘卡包' },
  { value: 'Charizard', label: '喷火龙卡包' },
  { value: 'Mewtwo', label: '超梦卡包' },
  { value: 'shared', label: '通用卡牌' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'Pokémon', label: '宝可梦' },
  { value: 'Trainer', label: '训练师' },
];

export default function CardFilters({ filters, onFilterChange }) {
  const handleFilterChange = (filterType, value) => {
    onFilterChange({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <div className="mb-8 flex flex-wrap gap-4 items-center">
      <select
        className="p-2 border rounded"
        value={filters.rarity}
        onChange={(e) => handleFilterChange('rarity', e.target.value)}
      >
        {RARITY_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded"
        value={filters.category}
        onChange={(e) => handleFilterChange('category', e.target.value)}
      >
        {CATEGORY_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded"
        value={filters.pack}
        onChange={(e) => handleFilterChange('pack', e.target.value)}
      >
        {PACK_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
