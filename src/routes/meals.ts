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

  app.get('/:id', { preHandler: [checkSessionId] }, async (request, reply) => {
    const user = request.user;

    const { id } = z
      .object({
        id: z.string().uuid(),
      })
      .parse(request.params);

    const meal = await knex('meals')
      .where('user_id', user?.id)
      .where('id', id)
      .orderBy('date', 'desc')
      .select();
    return reply.send({ meal });
  });

  app.delete(
    '/:id',
    { preHandler: [checkSessionId] },
    async (request, reply) => {
      const { id } = z
        .object({
          id: z.string().uuid(),
        })
        .parse(request.params);

      const meal = await knex('meals').where('id', id).first();

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' });
      }

      await knex('meals').where('id', id).delete();

      return reply.status(204).send();
    },
  );

  app.put('/:id', { preHandler: [checkSessionId] }, async (request, reply) => {
    const { id } = z
      .object({
        id: z.string().uuid(),
      })
      .parse(request.params);

    const { name, description, date, isOnDiet } = z
      .object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })
      .parse(request.body);

    const meal = await knex('meals').where('id', id).first();

    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found' });
    }

    await knex('meals').where('id', id).update({
      name,
      description,
      is_on_diet: isOnDiet,
      date: date.getTime(),
    });

    return reply.status(204).send();
  });

  app.get(
    '/metrics',
    { preHandler: [checkSessionId] },
    async (request, reply) => {
      const user = request.user;

      const meals = await knex('meals')
        .where('user_id', user?.id)
        .orderBy('date', 'desc');

      const totalOnDiet = await knex('meals')
        .where('is_on_diet', true)
        .andWhere('user_id', user?.id)
        .count('id', { as: 'total' });

      const totalNotOnDiet = await knex('meals')
        .where('is_on_diet', false)
        .andWhere('user_id', user?.id)
        .count('id', { as: 'total' });

      const { bestSequence } = meals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1;
          } else {
            acc.bestSequence = Math.max(acc.bestSequence, acc.currentSequence);
            acc.currentSequence = 0;
          }

          return acc;
        },
        { bestSequence: 0, currentSequence: 0 },
      );

      return reply.send({
        total: meals.length,
        totalOnDiet: totalOnDiet[0].total,
        totalNotOnDiet: totalNotOnDiet[0].total,
        bestSequence,
      });
    },
  );

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
