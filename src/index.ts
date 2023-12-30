import { MyContext } from "./types/MyContextInterface";
import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
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
import routes from "./routes/routes.js";
import { generateKpi } from "./facades/adminFacade.js";
import payments from "./routes/payment.js";
import { getUser } from "./facades/userFacade.js";
import pkg from "body-parser";
const { json } = pkg;
import { LooseAuthProp } from "@clerk/clerk-sdk-node";
import { handleWebhook } from "./facades/clerkFacade.js";
import { GraphQLError } from "graphql";

//Settings
declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}

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

//Api Router
app.use(bodyParser.text({ limit: "2000mb" }));
app.use(cors<cors.CorsRequest>());
app.use("/api/v1", routes);
app.use("/api/v1", payments);
app.post(
  "/api/v1/api/v1/clerk/webhook",
  bodyParser.raw({ type: "application/json" }),
  async function (req, res) {
    return await handleWebhook(req, res);
  }
);

//Cron Settings
cron.schedule("0 0 * * *", async () => {
  try {
    generateKpi();
  } catch (error) {
    console.error("Error al ejecutar la tarea programada:", error);
  }
});

//Apollo Server
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

const userCache = {};

const authMiddleware = async (req, res, next) => {
  try {
    const BearerToken = req.headers.authorization || "";
    const token = BearerToken.replace("Bearer ", "");
    const decodedToken: any = jwt.decode(token);
    const userId = decodedToken.sub;

    let user: any = null;

    if (userCache[userId]) {
      console.log("user from cache")
      user = userCache[userId].user;
    } else {
      user = await getUser(decodedToken);
      userCache[userId] = { user };
      console.log("user from db");

    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error on authMiddleware", error);
    req.user = null;
    next();
  }
};

app.use(authMiddleware);

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  json(),
  expressMiddleware(server, {
    context: async ({ req }: { req: any }) => {
      const user = req.user;
      if (!user) {
        throw new GraphQLError("User is not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 401 },
          },
        });
      }

      console.log("user", user);
      

      // Get the user's IP address from the request object
      const ipAddress = req.ip || req.socket.remoteAddress || "";

      // Get the user's device information from the request headers or wherever it's stored
      const deviceInfo = req.headers["user-agent"] || ""; // Adjust this to your needs

      return { user, ipAddress, deviceInfo };
    },
  })
);

httpServer.listen({ port: PORT });

console.log(`🚀 Server ready at http://localhost:${PORT}`);
