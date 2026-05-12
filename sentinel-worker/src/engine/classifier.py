"""
SERVICE: Sentinel-AI Semantic Intent Engine
DESCRIPTION: Classifies pipeline queries and checks policy boundaries.
"""

KNOWLEDGE_KEYWORDS = {
    "sentinel",
    "osaf",
    "middleware",
    "creator",
    "policy",
    "architecture",
    "tier",
    "security",
    "features",
    "internal",
}


def classify_intent(query: str) -> str:
    query_lower = query.lower()
    is_private = any(word in query_lower for word in KNOWLEDGE_KEYWORDS)
    return "PRIVATE" if is_private else "GENERIC"
