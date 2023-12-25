import { MyContext } from "./types/MyContextInterface";
import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { resolvers } from "./graphql/shema.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import dotenv from "dotenv";
import { typeDefs } from "./graphql/shema.js";
import cron from "node-cron";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { DateTimeTypeDefinition } from "graphql-scalars";
import path from "path";
import routes from "./routes/routes.js";
import { generateKpi } from "./facades/adminFacade.js";
import payments from "./routes/payment.js";
import { getUser } from "./facades/userFacade.js";
import pkg from "body-parser";
const { json } = pkg;
import {
  ClerkExpressWithAuth,
  LooseAuthProp,
  WithAuthProp,
} from "@clerk/clerk-sdk-node";
import { handleWebhook } from "./facades/clerkFacade.js";

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}
const timezone = "America/Sao_Paulo";

const prisma = new PrismaClient();
dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

app.use(bodyParser.json({ limit: "150mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "150mb",
    extended: true,
    parameterLimit: 50000,
  })
);
//Test

app.use(bodyParser.text({ limit: "2000mb" }));
app.use(cors<cors.CorsRequest>());
app.use("/v1", routes);
app.post(
  "/api/v1/api/v1/clerk/webhook",
  bodyParser.raw({ type: "application/json" }),
  async function (req, res) {
    return await handleWebhook(req, res);
  }
);
app.use("/api/v1", payments);

cron.schedule("0 0 * * *", async () => {
  try {
    generateKpi();
  } catch (error) {
    console.error("Error al ejecutar la tarea programada:", error);
  }
});

app.use(express.static(path.join("client")));

const httpServer = http.createServer(app);

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, DateTimeTypeDefinition],
  resolvers,
});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql/ws",
});

const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer<MyContext>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      let token = req.headers.authorization || "";
      //Remove Bearer from token
      token = token.replace("Bearer ", "");

      const user = await getUser(token as string);
      const ipAddress = req.ip || req.socket.remoteAddress || "";
      const deviceInfo = req.headers["user-agent"] || "";
      return { user, prisma, ipAddress, deviceInfo };
    },
  })
);

httpServer.listen({ port: PORT });

console.log(`🚀 Server ready at http://localhost:${PORT}`);
