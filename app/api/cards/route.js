import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

// 简单的内存缓存实现
const cache = new Map();
const CACHE_TTL = 3600000; // 1小时，以毫秒为单位

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function setCache(key, value) {
  cache.set(key, {
    value,
    expiry: Date.now() + CACHE_TTL
  });
}

// 数据库连接配置
// 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: false
      }
    : false
});

// 测试数据库连接
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// 创建索引的函数
async function createIndexesIfNotExist() {
  const client = await pool.connect();
  try {
    // 检查和创建索引
    await client.query(`
      DO $$ 
      BEGIN 
        -- Cards表的索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cards_localid') THEN
          CREATE INDEX idx_cards_localid ON Cards(localId);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cards_category') THEN
          CREATE INDEX idx_cards_category ON Cards(category);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cards_rarity') THEN
          CREATE INDEX idx_cards_rarity ON Cards(rarity);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cards_pack') THEN
          CREATE INDEX idx_cards_pack ON Cards(pack);
        END IF;
      END $$;
    `);
    console.log('Indexes checked/created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    client.release();
  }
}

// 在应用启动时创建索引
// createIndexesIfNotExist();

export async function GET(request) {
  try {
    const client = await pool.connect();
    try {
      const { searchParams } = new URL(request.url);
      const rarity = searchParams.get('rarity');
      const pack = searchParams.get('pack');
      const category = searchParams.get('category');
      const id = searchParams.get('id');

      if (id) {
        const cacheKey = `card:${id}`;
        const cachedCard = getCache(cacheKey);
        
        if (cachedCard) {
          return NextResponse.json({ card: cachedCard });
        }

        // 获取单张卡片详情
        const cardResult = await client.query(`
          SELECT 
            c.*,
            COALESCE(oc.quantity, 0) as owned_quantity,
            CASE 
              WHEN c.category = 'Pokémon' THEN (
                SELECT json_build_object(
                  'dexId', p.dexId,
                  'name', p.name,
                  'hp', p.hp,
                  'type', p.type,
                  'stage', p.stage
                )
                FROM PokemonCards p
                WHERE p.card_id = c.id
              )
              WHEN c.category = 'Trainer' THEN (
                SELECT json_build_object(
                  'trainerType', t.trainerType
                )
                FROM TrainerCards t
                WHERE t.card_id = c.id
              )
            END as details
          FROM Cards c
          LEFT JOIN OwnedCards oc ON c.id = oc.card_id
          WHERE c.localid = $1
        `, [id]);
        
        const card = cardResult.rows[0];
        
        if (card) {
          setCache(cacheKey, card);
        }
        
        return NextResponse.json({ card });
      }

      // 列表查询缓存
      const cacheKey = `cards:${rarity || ''}:${pack || ''}:${category || ''}`;
      const cachedResult = getCache(cacheKey);
      
      if (cachedResult) {
        return NextResponse.json(cachedResult);
      }

      // 主查询
      const mainQuery = `
        WITH FilteredCards AS (
          SELECT 
            c.id, c.localId, c.name, c.rarity, c.pack, c.category
          FROM Cards c
          WHERE 1=1
          ${rarity ? ' AND c.rarity = $1' : ''}
          ${pack ? ` AND c.pack = $${rarity ? 2 : 1}` : ''}
          ${category ? ` AND c.category = $${(rarity ? 1 : 0) + (pack ? 1 : 0) + 1}` : ''}
          ORDER BY CAST(c.localId AS INTEGER)
        )
        SELECT 
          fc.*,
          CASE 
            WHEN fc.category = 'Pokémon' THEN (
              SELECT json_build_object(
                'hp', p.hp,
                'type', p.type,
                'stage', p.stage
              )
              FROM PokemonCards p 
              WHERE p.card_id = fc.id
            )
            WHEN fc.category = 'Trainer' THEN (
              SELECT json_build_object(
                'trainerType', t.trainerType
              )
              FROM TrainerCards t 
              WHERE t.card_id = fc.id
            )
          END as details,
          COALESCE((SELECT quantity FROM OwnedCards o WHERE o.card_id = fc.id), 0) as owned_quantity
        FROM FilteredCards fc
      `;

      const mainParams = [
        ...(rarity ? [rarity] : []),
        ...(pack ? [pack] : []),
        ...(category ? [category] : [])
      ];

      const result = await client.query(mainQuery, mainParams);
      
      const response = {
        cards: result.rows
      };

      setCache(cacheKey, response);
      
      return NextResponse.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      detail: error.message,
      cards: [] 
    }, { status: 500 });
  }
}
