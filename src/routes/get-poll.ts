import { z } from "zod";
import { FastifyInstance } from "fastify";
import httpStatus from 'http-status-codes';
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

export class GetPoll {
  async handle(app: FastifyInstance) {
    app.get('/polls/:pollId', async (request, response) => {
      const schemaParams = z.object({
        pollId: z.string().uuid()
      });

      const { pollId } = schemaParams.parse(request.params);

      const poll = await prisma.poll.findUnique({
        where: {
          id: pollId
        },
        include: {
          options: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!poll) {
        return response.status(httpStatus.BAD_REQUEST).send({ message: "Poll not found." });
      }

      const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES');

      const votes = result.reduce((object, line, index) => {
        if (index % 2 === 0) {
          const score = Number(result[index + 1]);

          Object.assign(object, { [line]: score });
        }

        return object;
      }, {} as Record<string, number>);

      return response.status(httpStatus.OK).send({
        poll: {
          id: poll.id,
          title: poll.title,
          options: poll?.options?.map((option: any) => {
            return {
              id: option.id,
              title: option.title,
              score: (option.id in votes) ? votes[option.id] : 0
            }
          })
        }
      });
    });
  }
}