import { FastifyRequest, FastifyReply } from 'fastify';

export async function checkSessionId(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId = request.cookies.sessionId;

  if (!sessionId) {
    reply.code(401).send({
      message: 'Unauthorized',
    });
  }
}
