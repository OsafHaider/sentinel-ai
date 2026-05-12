import crypto from "crypto";
export const generateQueryHash = (query: string): string => {
  return crypto
    .createHash("md5")
    .update(query.toLowerCase().trim())
    .digest("hex");
};
