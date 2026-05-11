
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ApiError } from "../utils/api-error.js";

export const globalErrorHandler = async (
  error: FastifyError | ApiError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  let statusCode = 500;
  let message = "Something went wrong";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  console.error("[GLOBAL-ERROR-HANDLER]", {
    statusCode,
    message,
    path: request.url,
    method: request.method,
    error,
  });

  return reply.status(statusCode).send({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error instanceof Error ? error.stack : undefined,
    }),
  });
};