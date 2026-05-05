import os
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# 1. Setup
model = SentenceTransformer('all-MiniLM-L6-v2')
client = MongoClient(os.getenv("MONGO_URI"))
db = client["sentinel_db"]
collection = db["knowledge_base"]

# 2. Data to Seed
docs = [
    {
        "text": "The company leave policy allows 20 days of annual leave and 10 days of sick leave.",
        "category": "HR"
    },
    {
        "text": "Sentinel-AI is a high-performance gateway designed by Osaf for LLM optimization.",
        "category": "Project Info"
    }
]

# 3. Vectorize and Upload
print("Vectorizing and inserting documents...")

for doc in docs:
    # Embedding generate karein
    doc["embedding"] = model.encode(doc["text"]).tolist()
    result = collection.insert_one(doc)
    print(f"Inserted: {doc['category']} (ID: {result.inserted_id})")

print("\n Knowledge Base Seeded Successfully!")
