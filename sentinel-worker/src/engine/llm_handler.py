import os
from groq import AsyncGroq # 👈 Elite Move: Async use karo
from dotenv import load_dotenv

load_dotenv()

class LLMHandler:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"

    async def generate_response(self, query, context=""):
        system_instruction = (
            "You are Sentinel-AI, a strictly factual assistant. "
            "Your task is to answer user queries using ONLY the provided context. "
            "\n\nRULES:\n"
            "1. If relevant context is provided, answer using only that info.\n"
            "2. If NO context is provided or it's irrelevant, politely say: "
            "'I am sorry, but I do not have this information in my private knowledge base.'\n"
            "3. DO NOT use your internal training data to answer private queries.\n"
            "4. Be concise and professional."
        )

        if context:
            prompt = f"Context:\n{context}\n\nQuestion: {query}"
        else:
            prompt = f"Question: {query}\n(Note: No private context found for this query.)"

        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            return f"LLM Error: {str(e)}"

# Singleton instance
llm_handler = LLMHandler()
