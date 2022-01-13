"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuth = ({ context }, next) => {
    if (!context.req.headers.authorization) {
        throw new Error("not aunthenticated");
    }
    try {
        const verified = jsonwebtoken_1.default.verify(context.req.headers.authorization, "1234");
        context.req.user = verified._id;
    }
    catch (err) {
        console.error(err);
        throw new Error("not aunthenticated");
    }
    return next();
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map