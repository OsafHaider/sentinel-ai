import os
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import httpx
from src.config.mongo import insert_knowledge
from src.config.env import get_env_variable
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)
GATEWAY_WEBHOOK = f"{get_env_variable("GATEWAY_URL")}/api/v1/chat/webhook/ingest-status"

print(f"🧠 Sentinel Ingester: Loading {MODEL_NAME}...")

# 2. PDF Parsing & Embedding Logic
async def process_file_task(job, job_id):
    file_path = job.data.get("filePath")
    file_name = job.data.get("fileName")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return {"status": "failed", "error": "File not found"}

    try:
        print(f"📖 Starting Ingestion: {file_name}")

        # A. Text Extraction
        doc = fitz.open(file_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()

        # B. Smart Chunking (Recursive is best for RAG)
        # Chunk size 800-1000 characters ideal hai LLM context ke liye
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        chunks = text_splitter.split_text(full_text)
        print(f"✂️  Generated {len(chunks)} chunks for {file_name}")

        # C. Vectorization & MongoDB Insertion
        for i, chunk_text in enumerate(chunks):
            # Vector banayein
            vector = model.encode(chunk_text, convert_to_numpy=True).tolist()
            
            # MongoDB Atlas mein save karein (Aapka existing function)
            # Make sure mongo_client has 'insert_knowledge' method
            insert_knowledge({
                "source": file_name,
                "content": chunk_text,
                "embedding": vector,
                "metadata": {
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "ingested_at": "timestamp_placeholder" # Use datetime.now() if needed
                }
            })

        print(f"✅ Ingestion Successful: {file_name}")

        # D. Notify Gateway (Optional: UI ko update karne ke liye)
        await notify_ingestion_complete(file_name, len(chunks))

        # E. Cleanup (File delete kar dein processing ke baad)
        os.remove(file_path)
        print(f"🗑️  Temporary file removed: {file_path}")

        return {"status": "completed", "chunks": len(chunks)}

    except Exception as e:
        print(f"🔥 Ingestion Critical Error: {str(e)}")
        raise e

# 3. Webhook to tell UI "Learning Complete"
async def notify_ingestion_complete(file_name, chunk_count):
    payload = {
        "fileName": file_name,
        "status": "completed",
        "message": f"Sentinel has learned {chunk_count} new facts from {file_name}"
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(GATEWAY_WEBHOOK, json=payload)
    except:
        pass # Dashboard update fail ho toh bhi ingestion chalti rahegi


