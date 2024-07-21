import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

// MongoDB setup
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
let db;
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db('Cluster0');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Access login endpoint
app.post('/login', async (req, res) => {
  console.log('Received login request from:', req.body.username);
  const response = await loginHandler(req);
  res.status(response.status).set(response.headers).send(response.body);
});

function loginHandler(req) {
  const { username, password } = req.body;

  if (!username || !password) {
    return Promise.resolve({
      status: 400,
      body: JSON.stringify({ error: 'Username and password are required' }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return fetch('https://tl-onboarding-project-dxm7krgnwa-uc.a.run.app/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => ({
      status: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }))
    .catch(error => ({
      status: 401,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    }));
}

// Access prompt endpoint
app.post('/prompt', async (req, res) => {
  console.log('Received prompt request:', req.body);

  // Ensure the database connection is established
  if (!db) {
    return res.status(500).json({ error: 'Database connection not established' });
  }
  
  const response = await promptHandler(req);
  res.status(response.status).set(response.headers).send(response.body);
});

async function promptHandler(req) {
  const token = req.headers.authorization?.split(' ')[1];
  const { model, messages } = req.body;

  if (!token) {
    return {
      status: 401,
      body: JSON.stringify({ error: 'No token provided' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (!model || !messages) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Model and messages are required' }),
      headers: { 'Content-Type': 'application/json' }
    };
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

    const data = await response.json();

    // Store the prompt and response in MongoDB
    const db = client.db('Cluster0');
    const promptsCollection = db.collection('prompts');
    await promptsCollection.insertOne({
      prompt: { model, messages },
      response: data,
      timestamp: new Date()
    });

    return {
      status: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error handling prompt:', error);
    return {
      status: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}

// Start server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
