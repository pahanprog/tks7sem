"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.FriendsResolver = void 0;
const type_graphql_1 = require("type-graphql");
const isAuth_1 = require("../middleware/isAuth");
const Friends_1 = __importDefault(require("../entities/Friends"));
const User_1 = __importDefault(require("../entities/User"));
const typeorm_1 = require("typeorm");
let FriendsResolver = class FriendsResolver {
    sendFriendRequest(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const sender = yield User_1.default.findOne(req.user, { relations: ["outgoing", "outgoing.recipient"] });
            const recipient = yield User_1.default.findOne(id, { relations: ["incoming", "incoming.sender"] });
            if (!sender || !recipient) {
                return false;
            }
            const exists = yield Friends_1.default.findOne({ where: { sender, recipient } });
            if (exists) {
                console.log("ALREADY EXISTS");
                return true;
            }
            const request = yield Friends_1.default.create({
                sender,
                recipient,
                isMutual: false,
            }).save();
            if (!request.id) {
                return false;
            }
            return true;
        });
    }
    sendFriendResponse(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const recipient = yield User_1.default.findOne(req.user);
            const sender = yield User_1.default.findOne(id);
            const request = yield Friends_1.default.findOne({ where: { sender, recipient } });
            console.log(id, recipient, request);
            if (!request) {
                return false;
            }
            request.isMutual = true;
            request.save();
            return true;
        });
    }
    getFriendList({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne(req.user);
            const incoming = yield Friends_1.default.find({ where: { recipient: user, isMutual: true }, relations: ["sender"] });
            const outgoing = yield Friends_1.default.find({ where: { sender: user, isMutual: true }, relations: ["recipient"] });
            const friends = incoming.concat(outgoing);
            return friends;
        });
    }
    getIncomingRequests({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne(req.user);
            const incoming = yield Friends_1.default.find({ where: { recipient: user, isMutual: false }, relations: ["sender"] });
            return incoming;
        });
    }
    getOutgoingRequests({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne(req.user);
            const outgoing = yield Friends_1.default.find({ where: { sender: user, isMutual: false }, relations: ["recipient"] });
            return outgoing;
        });
    }
    getAllUsers({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne(req.user);
            const friends = yield Friends_1.default.find({ where: [{ sender: user, isMutual: true }, { recipient: user, isMutual: true }], relations: ["recipient", "sender"] });
            const ids = [user.id];
            friends.forEach(i => {
                if (i.sender.id === user.id) {
                    ids.push(i.recipient.id);
                }
                else {
                    ids.push(i.sender.id);
                }
            });
            const users = yield (0, typeorm_1.getConnection)().getRepository(User_1.default).createQueryBuilder("u").where("NOT u.id = ANY(:ids)", { ids: ids }).getMany();
            return users;
        });
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FriendsResolver.prototype, "sendFriendRequest", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FriendsResolver.prototype, "sendFriendResponse", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Friends_1.default]),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsResolver.prototype, "getFriendList", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Friends_1.default]),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsResolver.prototype, "getIncomingRequests", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Friends_1.default]),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsResolver.prototype, "getOutgoingRequests", null);
__decorate([
    (0, type_graphql_1.Query)(() => [User_1.default]),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsResolver.prototype, "getAllUsers", null);
FriendsResolver = __decorate([
    (0, type_graphql_1.Resolver)(() => Friends_1.default)
], FriendsResolver);
exports.FriendsResolver = FriendsResolver;
//# sourceMappingURL=friends.js.map