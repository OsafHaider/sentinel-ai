import os
from pathlib import Path
from dotenv import load_dotenv
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_path = ROOT_DIR / ".env"

load_dotenv(dotenv_path=env_path)

print(f"Searching .env at: {env_path}")
print(f"File exists: {env_path.exists()}")
def get_env_variable(key: str, default=None) -> str:
    value = os.getenv(key, default)
    if value is None:
        raise ValueError(f"Missing required environment variable: {key}")
    return value

class Config:
    REDIS_URL = get_env_variable("REDIS_URL")
    MONGO_URI = get_env_variable("MONGO_URI")
    MONGO_DB_NAME = get_env_variable("MONGO_DB_NAME")
    GATEWAY_URL = get_env_variable("GATEWAY_URL")
env = Config()
