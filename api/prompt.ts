import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { MongoClient, ServerApiVersion } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

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
      const response = await fetch('https://tl-onboarding-project-dxm7krgnwa-uc.a.run.app/prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages })
      });

      if (!response.ok) {
        throw new Error(`External API returned status: ${response.status}`);
      }

      const data = await response.json();

      await client.connect();
      const db = client.db('Cluster0');
      const promptsCollection = db.collection('prompts');
      await promptsCollection.insertOne({
        prompt: { model, messages },
        response: data,
        timestamp: new Date()
      });

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Unknown error occurred' });
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
