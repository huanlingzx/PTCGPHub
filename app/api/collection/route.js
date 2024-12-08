import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// // 创建索引的函数
// async function createCollectionIndexesIfNotExist() {
//   const client = await pool.connect();
//   try {
//     await client.query(`
//       DO $$ 
//       BEGIN 
//         -- OwnedCards表的索引
//         IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ownedcards_card_id') THEN
//           CREATE INDEX idx_ownedcards_card_id ON OwnedCards(card_id);
//         END IF;
//       END $$;
//     `);
//     console.log('Collection indexes checked/created successfully');
//   } catch (error) {
//     console.error('Error creating collection indexes:', error);
//   } finally {
//     client.release();
//   }
// }

// 在应用启动时创建索引
// createCollectionIndexesIfNotExist();

// GET endpoint to fetch all card quantities
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT card_id, quantity FROM OwnedCards'
    );
    return NextResponse.json({ collection: result.rows });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST endpoint to update card quantity
export async function POST(request) {
  const client = await pool.connect();
  try {
    const { cardId, quantity } = await request.json();
    
    if (typeof cardId !== 'number' || typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Upsert the quantity
    const result = await client.query(
      `INSERT INTO OwnedCards (card_id, quantity)
       VALUES ($1, $2)
       ON CONFLICT (card_id)
       DO UPDATE SET quantity = $2
       RETURNING card_id, quantity`,
      [cardId, quantity]
    );

    return NextResponse.json({ updated: result.rows[0] });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
