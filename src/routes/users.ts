import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const { name, email } = z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }

    const userEmailExists = await knex('users').where('email', email).first();

    if (userEmailExists) {
      return reply.code(400).send({
        message: 'User with this email already exists',
      });
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    });

    return reply.code(201).send();
  });
}
