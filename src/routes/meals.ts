import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';
import { checkSessionId } from '../middlewares/check-seesion-id';

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionId] }, async (request, reply) => {
    const user = request.user;

    const meals = await knex('meals')
      .where('user_id', user?.id)
      .orderBy('date', 'desc')
      .select();
    return reply.send({ meals });
  });

  app.post('/', { preHandler: [checkSessionId] }, async (request, reply) => {
    const { name, description, date, isOnDiet } = z
      .object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })
      .parse(request.body);

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_on_diet: isOnDiet,
      date: date.getTime(),
      user_id: request.user?.id,
    });

    return reply.status(201).send();
  });
}
