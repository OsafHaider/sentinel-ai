import crypto from "crypto";

/**
 * Generate MD5 hash of a query string
 * @param query - The query string to hash
 * @returns MD5 hash in hexadecimal format
 */
export const generateQueryHash = (query: string): string => {
  return crypto
    .createHash("md5")
    .update(query.toLowerCase().trim())
    .digest("hex");
};
