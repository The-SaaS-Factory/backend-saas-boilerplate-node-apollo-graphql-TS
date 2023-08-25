import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import ImageKit from "imagekit";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import resolvers from "./graphql/resolvers.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import dotenv from "dotenv";
import typeDefs from "./graphql/typeDefs.js";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { DateTimeResolver, DateTimeTypeDefinition } from "graphql-scalars";
const prisma = new PrismaClient();
dotenv.config();
const PORT = process.env.PORT || 8080;
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
}));
app.use(bodyParser.text({ limit: "200mb" }));
app.get("/v1/authimagekit", (req, res) => {
    var imagekit = new ImageKit({
        publicKey: "public_1dUhzEW8Sc5D7TuoLosMWsIsddw=",
        privateKey: "private_tCnAYjkGZ0dJK8G7TYJYLeC1CI0=",
        urlEndpoint: "https://ik.imagekit.io/cluzstudio",
    });
    res.send(imagekit.getAuthenticationParameters());
});
app.post("/v1/upload_files", (req, res) => {
    try {
        const imageKit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
        imageKit.upload({
            file: req.body.filepath,
            fileName: req.body.filename,
            folder: "creo_red/publications",
        }, function (err, response) {
            if (err) {
                return res.status(500).json({
                    status: "failed",
                    message: err.message,
                });
            }
            else {
                const { url } = response;
                
                res.json({
                    status: "success",
                    message: "Successfully uploaded files",
                    url: url,
                });
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: "failed",
            message: error.message,
        });
    }
});
const httpServer = http.createServer(app);
const JWT_SECRET = "EN_DIOS_CONFIO_BY_JESUS";
const getUser = async (token) => {
    try {
        if (token) {
            const decodedToken = jwt.verify(token, JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decodedToken.id },
                include: {
                    following: {
                        include: {
                            following: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });
            return user;
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.log(error);
    }
};
const schema = makeExecutableSchema({
    typeDefs: [typeDefs, DateTimeTypeDefinition],
    resolvers: {
        DateTime: DateTimeResolver,
        Query: {
            ...resolvers.Query,
        },
        Mutation: {
            ...resolvers.Mutation,
        },
        Subscription: {
            ...resolvers.Subscription,
        },
    },
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
const server = new ApolloServer({
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
// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use("/graphql", cors(), bodyParser.json(), 
// expressMiddleware accepts the same arguments:
// an Apollo Server instance and optional configuration options
expressMiddleware(server, {
    context: async ({ req, res }) => {
        // Get the user token from the headers.
        const token = req.headers.authorization || "";
        // Try to retrieve a user with the token
        const user = await getUser(token); // #todo
        // Add the user to the context
        return { user, prisma };
    },
}));
// app.get("/auth", async (req, res) => {
//   var ImageKit = require("imagekit");
//   var fs = require("fs");
//   var imagekit = new ImageKit({
//     publicKey: "your_public_api_key",
//     privateKey: "your_private_api_key",
//     urlEndpoint: "https://ik.imagekit.io/your_imagekit_id/",
//   });
//   var authenticationParameters = imagekit.getAuthenticationParameters();
//   console.log(authenticationParameters);
// });
// Modified server startup
await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at ${PORT}`);
