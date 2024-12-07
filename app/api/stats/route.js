import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 定义稀有度顺序
const RARITY_ORDER = [
  '◊',
  '◊◊',
  '◊◊◊',
  '◊◊◊◊',
  '☆',
  '☆☆',
  '☆☆☆',
  'Crown Rare'
];

export async function GET() {
  const client = await pool.connect();
  try {
    // 获取每个卡包每个稀有度的统计数据
    const packStatsResult = await client.query(`
      WITH PackRarityStats AS (
        SELECT 
          COALESCE(c.pack, 'shared') as pack,
          c.rarity,
          COUNT(*) as total,
          COUNT(CASE WHEN oc.quantity > 0 THEN 1 END) as owned,
          COUNT(*) - COUNT(CASE WHEN oc.quantity > 0 THEN 1 END) as missing
        FROM Cards c
        LEFT JOIN OwnedCards oc ON c.id = oc.card_id
        WHERE c.pack != 'mission'
        GROUP BY COALESCE(c.pack, 'shared'), c.rarity
      )
      SELECT 
        pack,
        json_agg(json_build_object(
          'rarity', rarity,
          'total', total,
          'owned', owned,
          'missing', missing
        )) as stats
      FROM PackRarityStats
      GROUP BY pack
    `);

    // 获取梦幻获取条件的进度
    const mewProgressResult = await client.query(`
      WITH OwnedPokemon AS (
        SELECT DISTINCT p.dexId
        FROM Cards c
        JOIN PokemonCards p ON c.id = p.card_id
        JOIN OwnedCards oc ON c.id = oc.card_id
        WHERE p.dexId BETWEEN 1 AND 150
        AND oc.quantity > 0
      ),
      MissingDexIds AS (
        SELECT DISTINCT p.dexId, p.name
        FROM PokemonCards p
        WHERE p.dexId BETWEEN 1 AND 150
        AND p.dexId NOT IN (SELECT dexId FROM OwnedPokemon)
        GROUP BY p.dexId, p.name
      )
      SELECT 
        (SELECT COUNT(*) FROM OwnedPokemon) as collected_count,
        (SELECT json_agg(
          json_build_object(
            'dexId', dexId,
            'name', name
          )
          ORDER BY dexId
        ) FROM MissingDexIds) as missing_pokemon
    `);

    // 计算每个卡包的总体统计，并按照预定义的稀有度顺序排序
    const packStats = {};
    packStatsResult.rows.forEach(row => {
      // 将统计数据转换为以稀有度为键的对象
      const statsMap = row.stats.reduce((acc, stat) => {
        acc[stat.rarity] = {
          total: stat.total,
          owned: stat.owned,
          missing: stat.missing
        };
        return acc;
      }, {});

      // 按照预定义顺序重新组织统计数据
      const orderedStats = {};
      let totalCards = 0;
      let ownedCards = 0;

      RARITY_ORDER.forEach(rarity => {
        if (statsMap[rarity]) {
          orderedStats[rarity] = statsMap[rarity];
          totalCards += statsMap[rarity].total;
          ownedCards += statsMap[rarity].owned;
        }
      });

      packStats[row.pack] = {
        stats: orderedStats,
        totalCards,
        ownedCards
      };
    });

    // 梦幻获取进度
    const mewProgress = mewProgressResult.rows[0];
    const collectedCount = mewProgress.collected_count;
    const missingPokemon = mewProgress.missing_pokemon || [];
    const totalRequired = 150;

    return NextResponse.json({ 
      packStats,
      mewProgress: {
        collectedCount,
        totalRequired,
        missingPokemon,
        isComplete: collectedCount === totalRequired
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
