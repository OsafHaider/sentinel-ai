from typing import Optional, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI LLM Generation Engine
DESCRIPTION: Interface layer for Groq Cloud inference, prompt hydration, and automated token metric extraction.
STANDARDS: Zero processing latency loops, programmatic exception containment, structural telemetry outputting.
"""

cloud_llm = ChatGroq(
    api_key=get_env_variable("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.1,
)

private_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are Sentinel-AI (Private Mode). Answer using ONLY the provided context.\n"
                "1. Use provided context only.\n"
                "2. If irrelevant, say: 'I am sorry, but I do not have this information in my private knowledge base.'\n"
                "3. Do not use internal training data."
            ),
        ),
        ("user", "Context:\n{context}\n\nQuestion: {query}"),
    ]
)

generic_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are Sentinel-AI (General Mode). Answer clearly using your knowledge.",
        ),
        ("user", "{query}"),
    ]
)


async def generate_response(
    query: str, context: Optional[str] = None, mode: str = "generic"
) -> Dict[str, Any]:
    active_prompt = private_prompt if mode == "private" else generic_prompt
    payload = (
        {"context": context, "query": query} if mode == "private" else {"query": query}
    )

    try:
        cloud_chain = active_prompt | cloud_llm
        response = await cloud_chain.ainvoke(payload)

        usage = response.response_metadata.get("token_usage", {})

        return {
            "text": response.content,
            "source": "cloud",
            "usage": {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
        }
    except Exception as cloud_err:
        logger.error(
            "Groq upstream inference cloud network loop collapsed",
            {
                "mode": mode,
                "err": {"message": str(cloud_err), "type": type(cloud_err).__name__},
            },
        )
        return {
            "text": "Sorry, the cloud intelligence system is currently experiencing technical difficulties.",
            "source": "error",
            "usage": {},
        }
