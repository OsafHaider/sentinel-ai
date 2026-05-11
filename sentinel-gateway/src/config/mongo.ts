import { MongoClient, Collection } from 'mongodb';
import { env } from './env.js';

let client: MongoClient;
let knowledgeCollection: Collection;
export const initMongo = async () => {
    if (knowledgeCollection) return knowledgeCollection;

    try {
        const uri = env.MONGO_URI;
        client = new MongoClient(uri);
        
        await client.connect();
        const db = client.db(env.MONGO_DB_NAME|| "sentinel_db");
        knowledgeCollection = db.collection("knowledge_base");
        
        console.log("✅ Sentinel-Gateway: MongoDB Connected (Hydration Ready)");
        return knowledgeCollection;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        throw error;
    }
};

export const getKnowledgeCollection = () => {
    if (!knowledgeCollection) throw new Error("Mongo not initialized. Call initMongo() first.");
    return knowledgeCollection;
};
