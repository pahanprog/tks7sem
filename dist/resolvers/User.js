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
exports.UserResolver = exports.FieldError = void 0;
const User_1 = __importDefault(require("../entities/User"));
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const typeorm_1 = require("typeorm");
let FieldError = class FieldError {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    (0, type_graphql_1.ObjectType)()
], FieldError);
exports.FieldError = FieldError;
let UserInput = class UserInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], UserInput.prototype, "username", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], UserInput.prototype, "email", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], UserInput.prototype, "password", void 0);
UserInput = __decorate([
    (0, type_graphql_1.InputType)()
], UserInput);
let UserResponse = class UserResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => User_1.default, { nullable: true }),
    __metadata("design:type", User_1.default)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], UserResponse);
let UserResolver = class UserResolver {
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userId) {
                return null;
            }
            const user = yield (0, typeorm_1.getConnection)().manager.findOne(User_1.default, {
                where: { id: req.session.userId }
            });
            return user;
        });
    }
    register({ req }, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const errResponse = {
                errors: []
            };
            if (!input.email) {
                errResponse.errors.push({ field: "email", message: "Must provide an email" });
            }
            if (!input.username) {
                errResponse.errors.push({ field: "username", message: "Must provide a username" });
            }
            if (!input.password) {
                errResponse.errors.push({ field: "password", message: "Must provide a password" });
            }
            if (errResponse.errors.length > 0) {
                return errResponse;
            }
            if (!String(input.email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
                errResponse.errors.push({ field: "email", message: "Must be a valid email" });
            }
            if (input.username.length < 6) {
                errResponse.errors.push({ field: "username", message: "Must be at least 6 chars long" });
            }
            if (input.password.length < 6) {
                errResponse.errors.push({ field: "password", message: "Must be at least 6 chars long" });
            }
            if (errResponse.errors.length > 0) {
                return errResponse;
            }
            const hashedPassword = yield argon2_1.default.hash(input.password);
            let saved;
            try {
                const user = User_1.default.create({
                    username: input.username,
                    email: input.email,
                    password: hashedPassword
                });
                saved = yield user.save();
            }
            catch (err) {
                if (err.code === "23505") {
                    if (err.detail.includes("email")) {
                        return {
                            errors: [{ field: "email", message: "Email already exists" }]
                        };
                    }
                    else {
                        return {
                            errors: [{
                                    field: "username",
                                    message: "username already exists"
                                }]
                        };
                    }
                }
                else {
                    console.error(err);
                }
            }
            if (saved) {
                req.session.userId = saved.id;
            }
            return { user: saved };
        });
    }
    login(usernameOrEmail, password, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            usernameOrEmail;
            password;
            req;
            const user = yield User_1.default.findOne({ where: usernameOrEmail.includes("@") ? { email: usernameOrEmail } : { username: usernameOrEmail } });
            if (!user) {
                return {
                    errors: [{
                            field: "usernameOrEmail",
                            message: "username or email not found"
                        }]
                };
            }
            const valid = yield argon2_1.default.verify(user.password, password);
            if (!valid) {
                return {
                    errors: [{
                            field: 'password',
                            message: "incorrect password"
                        }]
                };
            }
            req.session.userId = user.id;
            return { user };
        });
    }
    logout({ req, res }) {
        return __awaiter(this, void 0, void 0, function* () {
            req.session.destroy((err) => {
                if (err) {
                    console.error(err);
                }
            });
            res.clearCookie("qid");
            return true;
        });
    }
    changePfp({ req }, pfp) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne(req.session.userId);
            if (!user) {
                return "";
            }
            user.profilePicture = pfp;
            user.save();
            return pfp;
        });
    }
    changeInfo({ req }, username, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne(req.session.userId);
            user.email = email;
            user.username = username;
            user === null || user === void 0 ? void 0 : user.save();
            return user;
        });
    }
};
__decorate([
    (0, type_graphql_1.Query)(() => User_1.default, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __param(1, (0, type_graphql_1.Arg)('input', () => UserInput)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UserInput]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)("usernameOrEmail")),
    __param(1, (0, type_graphql_1.Arg)("password")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => String),
    __param(0, (0, type_graphql_1.Ctx)()),
    __param(1, (0, type_graphql_1.Arg)("pfp", () => String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePfp", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => User_1.default),
    __param(0, (0, type_graphql_1.Ctx)()),
    __param(1, (0, type_graphql_1.Arg)("username", () => String)),
    __param(2, (0, type_graphql_1.Arg)("email", () => String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changeInfo", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)(() => User_1.default)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=User.js.map