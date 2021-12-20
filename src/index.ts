import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import { createConnection } from "typeorm";
import cors from "cors";
import path from "path";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { MyContext } from "./constants";
import { TestResolver } from "./resolvers/TestResolver";

dotenv.config();

const main = async () => {
    try {
        const conn = await createConnection({
            type: "postgres",
            host: "localhost",
            port: 5050,
            username: "postgres",
            password: "1234",
            database: "SocNet",
            entities: [

            ],
            migrations: [path.join(__dirname, "./migrations/*")],
            synchronize: true,
            logging: true,
        })
    }
    catch (err) {
        console.error(err)
    }

    const corsOptions = {
        origin: ["*"],
        credentials: true,
    };

    const app = express();
    const http = require("http");
    const server = http.createServer(app);

    const apolloServer = new ApolloServer({
        introspection: true,
        playground: true,
        schema: await buildSchema({
            resolvers: [
                TestResolver
            ],
            validate: false,
        }),
        context: ({ req, res }: MyContext) => {
            return { req, res };
        },
    });

    app.use(express.json({ limit: "10mb" }));
    app.use(cors(corsOptions));

    apolloServer.applyMiddleware({ app, cors: false });

    const port: number = parseInt(process.env.PORT as string, 10);
    server.listen(port, async () => {
        console.log(`App runing at http://localhost:${port}`);
    });
}

main().catch((err) => console.error(err));