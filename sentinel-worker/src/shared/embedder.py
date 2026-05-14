from sentence_transformers import SentenceTransformer

"""
SERVICE: Sentinel-AI Matrix Vectorization Layer
DESCRIPTION: Instantiates embedding models globally to prevent redundant weights allocation.
STANDARDS: Singleton memory layouts, standard float transformations, explicit thread safety contexts.
"""

# Global singleton transformer instance to avoid reloading weights across service context boundaries
_transformer_instance = SentenceTransformer("all-MiniLM-L6-v2")


def compute_embedding(text: str) -> list:
    """
    Transforms clean alphanumeric text strings into dense floating-point spatial vectors.
    """
    if not text or not text.strip():
        return []

    return _transformer_instance.encode(text, convert_to_numpy=True).tolist()
