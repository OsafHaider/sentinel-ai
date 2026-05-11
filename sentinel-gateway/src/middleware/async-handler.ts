import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Wraps async route handlers to catch errors and pass them to Fastify's error handler
 */
export const asyncHandler = (
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any>
) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      // Pass error to Fastify's error handler
      throw error;
    }
  };
};
