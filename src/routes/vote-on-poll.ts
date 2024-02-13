import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FastifyInstance } from "fastify";
import httpStatus from "http-status-codes";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { voting } from "../utils/voting-pub-sub";

export class VoteOnPoll {
  async handle(app: FastifyInstance) {
    app.post('/polls/:pollId/votes', async (request, reply) => {
      const schemaBody = z.object({
        pollOptionId: z.string().uuid(),
      });

      const schemaParams = z.object({
        pollId: z.string().uuid(),
      });

      const { pollId } = schemaParams.parse(request.params);
      const { pollOptionId } = schemaBody.parse(request.body);

      let { sessionId } = request.cookies;

      if (sessionId) {
        const userPreviousVoteOnPoll = await prisma.vote.findUnique({
          where: {
            sessionId_pollId: {
              sessionId,
              pollId,
            }
          }
        })

        if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId) {
          await prisma.vote.delete({
            where: {
              id: userPreviousVoteOnPoll.id,
            }
          });

          const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId);

          voting.publish(pollId, {
            pollOptionId: userPreviousVoteOnPoll.pollOptionId,
            votes: Number(votes),
          });

        } else if (userPreviousVoteOnPoll) {
          return reply.status(httpStatus.BAD_REQUEST).send({ message: 'You have already voted on this poll' })
        }
      }

      if (!sessionId) {
        sessionId = randomUUID();

        reply.setCookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          signed: true,
          httpOnly: true,
        });
      }

      await prisma.vote.create({
        data: {
          sessionId,
          pollId,
          pollOptionId,
        }
      });

      const votes = await redis.zincrby(pollId, 1, pollOptionId);

      voting.publish(pollId, {
        pollOptionId,
        votes: Number(votes),
      });

      return reply.status(httpStatus.CREATED).send();
    });
  }
}
