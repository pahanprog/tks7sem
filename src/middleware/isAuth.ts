import { nextTick } from "process";
import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";
import jwt from "jsonwebtoken"

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
    if (!context.req.headers.authorization) {
        throw new Error("not aunthenticated");
    }

    try {
        const verified = jwt.verify(context.req.headers.authorization, "1234")
        context.req.user = verified._id
    } catch (err) {
        console.error(err)
        throw new Error("not aunthenticated");
    }

    return next();
};