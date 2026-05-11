import crypto from "crypto";
import { saveExactCache } from "./redis.js"; // Direct ye function use karein
import { getKnowledgeCollection } from "../config/mongo.js";

export const runHydration = async () => {
    const startTime = Date.now();
    try {
        const collection = getKnowledgeCollection();
        
        // 1. MongoDB se records uthayein
        const records = await collection.find({
            $or: [
                { query: { $exists: true } },
                { content: { $exists: true } }
            ]
        })
        .sort({ _id: -1 }) 
        .limit(500)
        .toArray();

        if (records.length === 0) {
            console.log("💧 [HYDRATOR] No records found in MongoDB to hydrate.");
            return;
        }

        console.log(`💧 [HYDRATOR] Processing ${records.length} records...`);

        let count = 0;

        // 2. Loop through records and save to Redis one by one
        // Pipeline ki zaroorat nahi, startup par ye bohot fast hai
        for (const doc of records) {
            const textToHash = doc.query || doc.content;
            const answer = doc.content;

            if (textToHash && answer) {
                const queryHash = crypto.createHash('md5')
                    .update(textToHash.toLowerCase().trim())
                    .digest('hex');

                // ✅ Aapka original function use kar raha hoon jo T1 save karta hai
                await saveExactCache(queryHash, answer);
                count++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [HYDRATION] Restored ${count} items to Tier-1 in ${duration}s`);

    } catch (error) {
        console.error("🔥 [HYDRATION-FAILED] Error Details:", error);
    }
};
