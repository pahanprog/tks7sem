"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const typeorm_1 = require("typeorm");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const TestResolver_1 = require("./resolvers/TestResolver");
const User_1 = __importDefault(require("./entities/User"));
const Post_1 = __importDefault(require("./entities/Post"));
const User_2 = require("./resolvers/User");
const post_1 = require("./resolvers/post");
const Friends_1 = __importDefault(require("./entities/Friends"));
const friends_1 = require("./resolvers/friends");
dotenv.config();
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conn = yield (0, typeorm_1.createConnection)({
            type: "postgres",
            host: "localhost",
            port: 5050,
            username: "postgres",
            password: "1234",
            database: "SocNet",
            entities: [
                User_1.default,
                Post_1.default,
                Friends_1.default
            ],
            migrations: [path_1.default.join(__dirname, "./migrations/*")],
            synchronize: true,
            logging: true,
        });
    }
    catch (err) {
        console.error(err);
    }
    const corsOptions = {
        origin: ["http://localhost:3000"],
        credentials: true,
    };
    const app = (0, express_1.default)();
    const http = require("http");
    const server = http.createServer(app);
    app.set("trust proxy", 1);
    const apolloServer = new apollo_server_express_1.ApolloServer({
        introspection: true,
        playground: true,
        schema: yield (0, type_graphql_1.buildSchema)({
            resolvers: [
                TestResolver_1.TestResolver,
                User_2.UserResolver,
                post_1.PostResolver,
                friends_1.FriendsResolver
            ],
            validate: false,
        }),
        context: ({ req, res }) => {
            return { req, res };
        },
    });
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use((0, cors_1.default)(corsOptions));
    apolloServer.applyMiddleware({ app, cors: false });
    const port = parseInt(process.env.PORT, 10);
    server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`App runing at http://localhost:${port}`);
    }));
});
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map