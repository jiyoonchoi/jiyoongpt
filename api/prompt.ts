import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient;
let isClientConnected = false;

// MDB Auto IP
const getMongoUri = async (): Promise<string> => {
  const ip = await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip);
  return `mongodb://username:password@${ip}:port/database`;
};

const connectToMongoDB = async () => {
  if (!client || !isClientConnected) {
    const uri = await getMongoUri();
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    try {
      await client.connect();
      isClientConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB', error);
    }
  }
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
      // Ensure MongoDB connection
      await connectToMongoDB();

      const response = await fetch('https://tl-onboarding-project-dxm7krgnwa-uc.a.run.app/prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages })
      });

      const data = await response.json();

      const db = client.db('Cluster0');
      const promptsCollection = db.collection('prompts');
      await promptsCollection.insertOne({
        prompt: { model, messages },
        response: data,
        timestamp: new Date()
      });

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
