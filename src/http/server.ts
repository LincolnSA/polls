import 'dotenv/config';
import fastify from "fastify";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import { CreatePoll } from "../routes/create-poll";
import { GetPoll } from "../routes/get-poll";
import { VoteOnPoll } from "../routes/vote-on-poll";
import { ResultsPoll } from "../routes/results-poll";
import { env } from '../env';

const app = fastify();
const port = env.APP_PORT;
const host = env.APP_HOST;

const createPoll = new CreatePoll();
const getPoll = new GetPoll();
const voteOnPoll = new VoteOnPoll();
const resultsPoll = new ResultsPoll();

app.register(cookie, {
  secret: env.COOKIE_SECRET,
  hook: "onRequest",
});

app.register(websocket);

app.register(createPoll.handle);
app.register(getPoll.handle);
app.register(voteOnPoll.handle);
app.register(resultsPoll.handle);

app
  .listen({ port, host })
  .then(() => console.log("[SERVER] - HTTP server runing"))
  .catch((error) => console.error("[SERVER] - Error", error));