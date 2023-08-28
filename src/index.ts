import jwt from "jsonwebtoken";
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
import { DateTimeResolver, DateTimeTypeDefinition } from "graphql-scalars";
import * as Sentry from "@sentry/node";
import { env } from "process";
import webpush from "web-push";
import path from "path";
import routes from "./routes/routes.js";
import { generateKpi } from "./facades/adminFacade.js";
import fetch from "node-fetch";

import payments from "./routes/payment.js";
import shop from "./routes/shop.js";
import sitemap from "./routes/sitemap.js";
 

const timezone = "America/Sao_Paulo";

const prisma = new PrismaClient();
dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

Sentry.init({
  dsn: "https://21fbce13871e4528a8320fe1777544a2@o4505182716690432.ingest.sentry.io/4505537073315840",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],

  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(cors());

app.use(bodyParser.json({ limit: "150mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "150mb",
    extended: true,
    parameterLimit: 500000,
  })
);
app.use(bodyParser.text({ limit: "2000mb" }));

app.use("/v1", routes);
app.use("/v1", payments);
app.use("/v1", shop);
app.use("/", sitemap);

app.get("/testemail", async (req, res) => {
  try {
    const emails = {
      emails: {
        email: "cluzstudio@gmail.com",
        welcome_body: "Test",
        welcome_title: "Test title",
        subject: "Test subject",
        type: "welcome",
      },
    };

    const url = "http://127.0.0.0:8000/api/v1/send-email";
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(emails),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.json(error);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    generateKpi();
  } catch (error) {
    console.error("Error al ejecutar la tarea programada:", error);
  }
});

app.use(express.static(path.join("client")));

const httpServer = http.createServer(app);

const JWT_SECRET = "EN_DIOS_CONFIO_BY_JESUS";

const getUser = async (token: any) => {
  try {
    if (token) {
      const decodedToken: any = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decodedToken.id },
      });

      return user;
    } else {
      // throw new Error('401');
    }
  } catch (error) {
    console.log(error);
  }
};

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, DateTimeTypeDefinition],
  resolvers,
});

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: "/graphql/ws",
});

// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer<MyContext>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Proper shutdown for the WebSocket server.
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

// Ensure we wait for our server to start
await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  bodyParser.json({ limit: "1500mb" }),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    // context: async ({ req, res }) => {
    //   const token = req.headers.authorization || "";
    //   const user = await getUser(token); // #todo
    //   return { user, prisma };
    // },
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      const user = await getUser(token);

      // Get the user's IP address from the request object
      const ipAddress = req.ip || req.socket.remoteAddress || "";

      // Get the user's device information from the request headers or wherever it's stored
      const deviceInfo = req.headers["user-agent"] || ""; // Adjust this to your needs

      return { user, prisma, ipAddress, deviceInfo };
    },
  })
);

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.use(Sentry.Handlers.errorHandler());
await new Promise<void>((resolve) =>
  httpServer.listen({ port: PORT }, resolve)
);

console.log(`🚀 Server ready at http://localhost:${PORT}`);
