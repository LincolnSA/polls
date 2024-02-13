import { z } from "zod";
import { FastifyInstance } from "fastify";
import { voting } from "../utils/voting-pub-sub";

export class ResultsPoll {
  async handle(app: FastifyInstance) {
    app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
      const schemaParams = z.object({
        pollId: z.string().uuid(),
      });

      const { pollId } = schemaParams.parse(request.params);

      voting.subscribe(pollId, (message) => {
        connection.socket.send(JSON.stringify(message))
      });
    });
  }
}
