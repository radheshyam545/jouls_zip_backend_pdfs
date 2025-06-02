import { MongoClient } from 'mongodb';
import { envConfig } from './envConfig.js';

let db;

export const connectDB = async () => {
  const client = new MongoClient(envConfig.mongodbUri);

  try {
    await client.connect();
    db = client.db(); // default DB
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export const getDB = () => db;
