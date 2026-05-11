import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8008", 10),
  REDIS_URL: getEnvVariable("REDIS_URL"),
  MONGO_URI: getEnvVariable("MONGO_URI"),
  MONGO_DB_NAME: getEnvVariable("MONGO_DB_NAME"),
  CLIENT_URL: getEnvVariable("CLIENT_URL"),
};
