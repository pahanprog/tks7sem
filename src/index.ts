import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import { createConnection } from "typeorm";
import cors from "cors";
import path from "path";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { MyContext } from "./types";
import { TestResolver } from "./resolvers/TestResolver";
import User from "./entities/User";
import Post from "./entities/Post";
import Redis from "redis"
import connectRedis from "connect-redis"
import session from "express-session"
import { UserResolver } from "./resolvers/User";
import { PostResolver } from "./resolvers/post";
import Friends from "./entities/Friends";
import { FriendsResolver } from "./resolvers/friends";

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
                User,
                Post,
                Friends
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
        origin: ["http://localhost:3000"],
        credentials: true,
    };

    const app = express();
    const http = require("http");
    const server = http.createServer(app);

    const RedisStore = connectRedis(session)
    const redis = Redis.createClient({})
    app.set("trust proxy", 1);

    app.use(session({
        name: "qid",
        store: new RedisStore({
            client: redis,
            disableTouch: true
        }), cookie: {
            maxAge: 1000 * 60 * 60 * 24,
        },
        saveUninitialized: false,
        secret: "uihgre",
        resave: false
    }))

    const apolloServer = new ApolloServer({
        introspection: true,
        playground: true,
        schema: await buildSchema({
            resolvers: [
                TestResolver,
                UserResolver,
                PostResolver,
                FriendsResolver
            ],
            validate: false,
        }),
        context: ({ req, res }: MyContext) => {
            return { req, res, redis };
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