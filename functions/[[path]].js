// credits : kasan
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://shanovenleyo_db_user:StulbJH8D3YlG94K@cluster0.aoq6ixx.mongodb.net/jawa?appName=Cluster0";
let client;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db('jawa');
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (context.request.method === 'POST' && path === '/api/upload') {
    try {
      const formData = await context.request.formData();
      const file = formData.get('file');
      if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400 });

      const buffer = await file.arrayBuffer();
      const id = Math.random().toString(36).substring(2, 8);
      
      const db = await connectDB();
      await db.collection('uploads').insertOne({
        _id: id,
        name: file.name,
        type: file.type,
        data: new Uint8Array(buffer),
        date: new Date()
      });

      return new Response(JSON.stringify({ success: true, id, url: `/u/${id}` }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (context.request.method === 'GET' && path.startsWith('/u/')) {
    const id = path.split('/').pop();
    try {
      const db = await connectDB();
      const doc = await db.collection('uploads').findOne({ _id: id });
      
      if (!doc) return new Response('File Not Found', { status: 404 });

      return new Response(doc.data.buffer, {
        headers: {
          'Content-Type': doc.type,
          'Cache-Control': 'public, max-age=86400',
          'Content-Disposition': `inline; filename="${doc.name}"`
        }
      });
    } catch (e) {
      return new Response('Error', { status: 500 });
    }
  }

  return context.env.ASSETS.fetch(context.request);
}
