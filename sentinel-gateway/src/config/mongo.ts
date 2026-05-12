import { MongoClient, Collection } from 'mongodb';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * SERVICE: Sentinel-AI MongoDB Connection Layer
 * DESCRIPTION: Initializes and manages the connection pool to MongoDB for Vector/Knowledge retrieval.
 * STANDARDS: Singleton instance management, asynchronous state pooling, structured telemetry error propagation.
 */

let client: MongoClient;
let knowledgeCollection: Collection;

export const initMongo = async (): Promise<Collection> => {
    if (knowledgeCollection) return knowledgeCollection;

    try {
        const uri = env.MONGO_URI;
        client = new MongoClient(uri);
        
        await client.connect();
        const db = client.db(env.MONGO_DB_NAME || "sentinel_db");
        knowledgeCollection = db.collection("knowledge_base");
        
        logger.info("Sentinel-Gateway: MongoDB persistence layer connected successfully");
        return knowledgeCollection;
    } catch (error) {
        logger.fatal({ err: error }, "MongoDB critical connection handshake failed");
        throw error;
    }
};

export const getKnowledgeCollection = (): Collection => {
    if (!knowledgeCollection) {
        logger.fatal("State Access Violation: Knowledge collection requested before MongoDB pool initialization");
        throw new Error("Mongo not initialized. Call initMongo() first.");
    }
    return knowledgeCollection;
};
