import { FastifyInstance } from 'fastify';
import { chatController } from './chat.controller.js';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post('/', chatController.handleChat);
  fastify.get('/status/:jobId', chatController.getJobStatus);
  fastify.post('/webhook/result', chatController.handleWebhook);
  fastify.get('/stats', chatController.getStats);

}
