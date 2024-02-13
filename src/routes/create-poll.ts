import { z } from "zod";
import { FastifyInstance } from "fastify";
import httpStatus from 'http-status-codes';
import { prisma } from "../lib/prisma";

export class CreatePoll {
  async handle(app: FastifyInstance) {
    app.post('/polls', async (request, response) => {
      const schemaBody = z.object({
        title: z.string(),
        options: z.array(z.string()),
      });

      const { title, options } = schemaBody.parse(request.body);

      const poll = await prisma.poll.create({
        data: {
          title,
          options: {
            createMany: {
              data: options.map(option => ({ title: option }))
            }
          }
        }
      });

      return response.status(httpStatus.CREATED).send({ pollId: poll.id });
    });
  }
}
