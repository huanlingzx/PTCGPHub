'use client';

import { useState } from 'react';

export default function CollectionStats({ packStats, mewProgress }) {
  const [showMissingDex, setShowMissingDex] = useState(false);

  if (!packStats) return null;

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">卡片收集统计</h2>
      
      {/* 梦幻获取进度 */}
      {mewProgress && (
        <div className="mb-6 bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-purple-800">梦幻获取进度</h3>
            <button
              onClick={() => setShowMissingDex(!showMissingDex)}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              {showMissingDex ? '隐藏详情' : '查看详情'}
            </button>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-purple-200 rounded-full">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${(mewProgress.collectedCount / mewProgress.totalRequired) * 100}%` }}
                />
              </div>
              <span className="text-sm text-purple-800">
                {mewProgress.collectedCount}/{mewProgress.totalRequired}
              </span>
            </div>
            {mewProgress.isComplete ? (
              <p className="mt-2 text-sm text-green-600">
                恭喜！你已经收集齐了全部150只宝可梦，可以获得梦幻卡片了！
              </p>
            ) : (
              <p className="mt-2 text-sm text-purple-600">
                收集齐全部150只宝可梦就可以获得梦幻卡片
              </p>
            )}
            {showMissingDex && mewProgress.missingPokemon.length > 0 && (
              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                <p className="text-sm text-purple-800 mb-2">还缺少的宝可梦：</p>
                <div className="flex flex-wrap gap-2">
                  {mewProgress.missingPokemon.map(pokemon => (
                    <span key={pokemon.dexId} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      #{String(pokemon.dexId).padStart(3, '0')} {pokemon.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 卡包统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(packStats).map(([packName, data]) => (
          <div key={packName} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {packName === 'shared' ? '通用卡牌' : `${packName}卡包`}
            </h3>
            <div className="text-sm space-y-1">
              <p>总卡片数: {data.totalCards}</p>
              <p>已拥有: {data.ownedCards}</p>
              <p>完成度: {((data.ownedCards / data.totalCards) * 100).toFixed(1)}%</p>
              <div className="mt-2">
                <div className="text-xs font-semibold mb-2">各稀有度统计:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(data.stats).map(([rarity, stats]) => (
                    <div key={rarity} className="text-xs text-gray-600 flex justify-between">
                      <span className="font-medium min-w-[60px]">{rarity}:</span>
                      <span className="tabular-nums">
                        {stats.owned}&nbsp;/&nbsp;{stats.total}
                        <span className="ml-2 text-gray-400">
                          ({((stats.owned / stats.total) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
