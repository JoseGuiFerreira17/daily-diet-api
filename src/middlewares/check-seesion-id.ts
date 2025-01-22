import { FastifyRequest, FastifyReply } from 'fastify';
import { knex } from '../database';

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

  const user = await knex('users').where('session_id', sessionId).first();

  if (!user) {
    reply.status(401);
    return { error: 'Unauthorized' };
  }

  request.user = user;
}
