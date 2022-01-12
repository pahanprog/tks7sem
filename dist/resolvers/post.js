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
exports.PostResolver = void 0;
const type_graphql_1 = require("type-graphql");
const User_1 = require("./User");
const Post_1 = __importDefault(require("../entities/Post"));
const User_2 = __importDefault(require("../entities/User"));
const isAuth_1 = require("../middleware/isAuth");
const Friends_1 = __importDefault(require("../entities/Friends"));
const typeorm_1 = require("typeorm");
let PostInput = class PostInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "body", void 0);
__decorate([
    (0, type_graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], PostInput.prototype, "picture", void 0);
PostInput = __decorate([
    (0, type_graphql_1.InputType)()
], PostInput);
let PostResponse = class PostResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [User_1.FieldError], { nullable: true }),
    __metadata("design:type", Array)
], PostResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => Post_1.default, { nullable: true }),
    __metadata("design:type", Post_1.default)
], PostResponse.prototype, "post", void 0);
PostResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], PostResponse);
let PostResolver = class PostResolver {
    isLiked(post, { req }) {
        if (!post.likes) {
            return false;
        }
        let result = false;
        post.likes.forEach(l => {
            if (l.id === req.session.userId) {
                result = true;
            }
        });
        return result;
    }
    createPost({ req }, input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!input.body && !input.title) {
                return {
                    errors: [{
                            field: "body",
                            message: "post must have a body"
                        },
                        {
                            field: "title",
                            message: "post must have a title"
                        }]
                };
            }
            else if (!input.body) {
                return {
                    errors: [{
                            field: "body",
                            message: "post must have a body"
                        }]
                };
            }
            else if (!input.title) {
                return {
                    errors: [
                        {
                            field: "title",
                            message: "post must have a title"
                        }
                    ]
                };
            }
            else {
                const user = yield User_2.default.findOne(req.session.userId, { relations: ["posts"] });
                const post = yield Post_1.default.create({
                    body: input.body,
                    title: input.title,
                    picture: input.picture,
                }).save();
                user.posts.push(post);
                user === null || user === void 0 ? void 0 : user.save();
                post.likeCount = 0;
                post.creator = user;
                return {
                    post
                };
            }
        });
    }
    editPost(id, input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield Post_1.default.findOne(id, { relations: ["creator"] });
            if (!post) {
                return {
                    errors: [{ field: "id", message: "id does not match a post" }]
                };
            }
            if (post.creator.id !== req.session.userId) {
                return {
                    errors: [{ field: "creator", message: "you are not the creator of this post" }]
                };
            }
            if (!input.body && !input.title) {
                return {
                    errors: [{
                            field: "body",
                            message: "post must have a body"
                        },
                        {
                            field: "title",
                            message: "post must have a title"
                        }]
                };
            }
            else if (!input.body) {
                return {
                    errors: [{
                            field: "body",
                            message: "post must have a body"
                        }]
                };
            }
            else if (!input.title) {
                return {
                    errors: [
                        {
                            field: "title",
                            message: "post must have a title"
                        }
                    ]
                };
            }
            else {
                post.body = input.body;
                post.title = input.title;
                if (input.picture)
                    post.picture = input.picture;
                post.isEdited = true;
                const saved = yield post.save();
                return {
                    post: saved
                };
            }
        });
    }
    deletePost(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield Post_1.default.findOne(id, { relations: ["creator"] });
            if (!post) {
                return false;
            }
            if (post.creator.id !== req.session.userId) {
                return false;
            }
            const deleted = yield post.remove();
            return true;
        });
    }
    likePost(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_2.default.findOne(req.session.userId);
            const post = yield Post_1.default.findOne(id, { relations: ["likes"] });
            if (!user || !post) {
                return -1;
            }
            post.likes.push(user);
            post.save();
            return post.likes.length;
        });
    }
    unlikePost(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield Post_1.default.findOne(id, { relations: ["likes"] });
            if (!post) {
                return -1;
            }
            const filtered = post.likes.filter((i) => { return i.id !== req.session.userId; });
            post.likes = filtered;
            post.save();
            return post.likes.length;
        });
    }
    getPostById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield Post_1.default.findOne(id, { relations: ["likes"] });
            if (post) {
                post.likeCount = post.likes.length;
            }
            return post;
        });
    }
    getFeed({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_2.default.findOne(req.session.userId);
            const friends = yield Friends_1.default.find({ where: [{ sender: user, isMutual: true }, { recipient: user, isMutual: true }], relations: ["recipient", "sender"] });
            const ids = [];
            ids.push(user.id);
            friends.forEach(i => {
                console.log(i);
                if (i.sender.id === user.id) {
                    ids.push(i.recipient.id);
                }
                else {
                    ids.push(i.sender.id);
                }
            });
            console.log(ids);
            const posts = yield (0, typeorm_1.getConnection)().getRepository(Post_1.default).createQueryBuilder("p").leftJoinAndSelect("p.likes", "l").leftJoinAndSelect("p.creator", "c").where("p.creatorId = ANY(:ids)", { ids: ids }).orderBy("p.createdAt", "DESC").getMany();
            posts.forEach(i => {
                i.likeCount = i.likes.length;
            });
            return posts;
        });
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => Boolean),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.default, Object]),
    __metadata("design:returntype", Boolean)
], PostResolver.prototype, "isLiked", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => PostResponse, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __param(1, (0, type_graphql_1.Arg)("input", () => PostInput)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PostInput]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => PostResponse),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("input", () => PostInput)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "editPost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => type_graphql_1.Int),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "likePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => type_graphql_1.Int),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "unlikePost", null);
__decorate([
    (0, type_graphql_1.Query)(() => Post_1.default, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "getPostById", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Post_1.default]),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "getFeed", null);
PostResolver = __decorate([
    (0, type_graphql_1.Resolver)(() => Post_1.default)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.js.map