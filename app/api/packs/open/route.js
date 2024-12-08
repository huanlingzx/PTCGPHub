import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: false
      }
    : false
});

const special_slot4_rarities = {
  'Crown Rare': 0.0004,    // 0.04%
  '☆☆☆': 0.00222,        // 0.222%
  '☆☆': 0.005,           // 0.5%
  '☆': 0.02572,          // 2.572%
  '◊◊◊◊': 0.01666,       // 1.666%
  '◊◊◊': 0.05,           // 5%
  '◊◊': 0.9              // 90%
};

const special_slot5_rarities = {
  'Crown Rare': 0.0016,    // 0.16%
  '☆☆☆': 0.00888,        // 0.888%
  '☆☆': 0.02,            // 2%
  '☆': 0.10288,          // 10.288%
  '◊◊◊◊': 0.06664,       // 6.664%
  '◊◊◊': 0.2,            // 20%
  '◊◊': 0.6              // 60%
};

function getRandomRarity(rarities) {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const [rarity, probability] of Object.entries(rarities)) {
    cumulativeProbability += probability;
    if (random <= cumulativeProbability) {
      return rarity;
    }
  }
  
  return '◊◊'; 
}

function getCardImageUrl(localId) {
  const paddedId = localId.toString().padStart(3, '0');
  return `/cards/a1-${paddedId}.png`;
}

async function getRandomCard(packType, rarity) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT *
      FROM cards
      WHERE (pack = $1 OR pack = 'shared')
      AND rarity = $2
      ORDER BY RANDOM()
      LIMIT 1
    `;
    
    const result = await client.query(query, [packType, rarity]);
    if (result.rows.length > 0) {
      const card = result.rows[0];
      return {
        ...card,
        image_url: getCardImageUrl(card.localid)
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting random card:', error);
    return null;
  } finally {
    client.release();
  }
}

export async function POST(request) {
  try {
    const { packType } = await request.json();
    
    if (!packType) {
      return NextResponse.json({ error: '无效的卡包类型' }, { status: 400 });
    }
    
    const cards = [];
    
    // 前3张固定◊稀有度
    for (let i = 0; i < 3; i++) {
      const card = await getRandomCard(packType, '◊');
      if (card) {
        cards.push(card);
      }
    }
    
    // 第4张特殊稀有度
    const rarity4 = getRandomRarity(special_slot4_rarities);
    const card4 = await getRandomCard(packType, rarity4);
    if (card4) {
      cards.push(card4);
    }
    
    // 第5张特殊稀有度
    const rarity5 = getRandomRarity(special_slot5_rarities);
    const card5 = await getRandomCard(packType, rarity5);
    if (card5) {
      cards.push(card5);
    }
    
    return NextResponse.json({ cards });
    
  } catch (error) {
    console.error('Pack opening error:', error);
    return NextResponse.json({ error: '开包失败，请重试' }, { status: 500 });
  }
}
