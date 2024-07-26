import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { MongoClient, ServerApiVersion } from 'mongodb';

const mongoUri = process.env.MONGODB_URI as string;

if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

let client: MongoClient | null = null;

const connectToMongoDB = async () => {
  if (!client) {
    client = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    await client.connect();
  }
  return client;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const { model, messages } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    try {
      console.log('Connecting to MongoDB...');
      const mongoClient = await connectToMongoDB();
      const db = mongoClient.db('Cluster0');
      const promptsCollection = db.collection('prompts');

      console.log('Fetching data from external API...');
      const fetchStart = Date.now();
      const response = await fetch('https://tl-onboarding-project-dxm7krgnwa-uc.a.run.app/prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages })
      });
      console.log('Fetched data in', Date.now() - fetchStart, 'ms');

      const data = await response.json();

      console.log('Inserting data into MongoDB...');
      await promptsCollection.insertOne({
        prompt: { model, messages },
        response: data,
        timestamp: new Date()
      });

      res.status(200).json(data);
    } catch (error) {
      console.error('Error in handler:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
