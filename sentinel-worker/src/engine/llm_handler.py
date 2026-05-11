from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from src.config.env import get_env_variable
load_dotenv()

# 1. Model Initialize (Global)
llm = ChatGroq(
    api_key=get_env_variable("GROQ_API_KEY"), model="llama-3.1-8b-instant", temperature=0.1
)

# ---------------------------------------------------------
# CASE 1: Private Knowledge Chain (Strict RAG)
# ---------------------------------------------------------
private_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are Sentinel-AI (Private Mode). You are a strictly factual assistant. "
                "Answer using ONLY the provided context.\n\n"
                "RULES:\n"
                "1. Use provided context only.\n"
                "2. If context is irrelevant or missing, say: 'I am sorry, but I do not have this information in my private knowledge base.'\n"
                "3. Do not use your internal training data for this response."
            ),
        ),
        ("user", "Context:\n{context}\n\nQuestion: {query}"),
    ]
)

private_chain = private_prompt | llm | StrOutputParser()

# ---------------------------------------------------------
# CASE 2: Generic Knowledge Chain (Open Mode)
# ---------------------------------------------------------
generic_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are Sentinel-AI (General Mode). You are a helpful and knowledgeable assistant. "
                "Answer the user's question clearly using your general knowledge."
            ),
        ),
        ("user", "{query}"),
    ]
)

generic_chain = generic_prompt | llm | StrOutputParser()


# ---------------------------------------------------------
# Main Router Function
# ---------------------------------------------------------
async def generate_response(query, context=None, mode="generic"):
    """
    Decides which chain to use based on the 'mode' passed by the worker.
    """
    try:
        if mode == "private":
            # Strict mode: Sirf provide kiya gaya context use hoga
            print(f"🛡️ [LLM-ROUTER] Routing to Private Chain for: {query[:30]}...")
            response = await private_chain.ainvoke({"context": context, "query": query})
            return response
        else:
            # Generic mode: LLM apni general knowledge use karega
            print(f"🌍 [LLM-ROUTER] Routing to Generic Chain for: {query[:30]}...")
            response = await generic_chain.ainvoke({"query": query})
            return response

    except Exception as e:
        print(f"🔥 [LLM-ERROR]: {str(e)}")
        return f"Sentinel LLM Error: {str(e)}"
