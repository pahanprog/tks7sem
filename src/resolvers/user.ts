import User from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "src/types";
import { getConnection } from "typeorm";
import jwt from "jsonwebtoken"
import { isAuth } from "../middleware/isAuth";

@ObjectType()
export class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@InputType()
class UserInput {
    @Field()
    username: string;

    @Field()
    email: string;

    @Field()
    password: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => String, { nullable: true })
    token?: string

}

@Resolver(() => User)
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req }: MyContext) {
        console.log(req.headers.authorization)
        if (!req.headers.authorization) {
            return null;
        }
        try {
            const verified = jwt.verify(req.headers.authorization, "1234")
            const user = await getConnection().manager.findOne(User, {
                where: { id: verified._id }
            })
            return user;
        } catch (err) {
            console.error(err)
            return null
        }

    }

    @Mutation(() => UserResponse, { nullable: true })
    async register(@Ctx() { req }: MyContext, @Arg('input', () => UserInput) input: UserInput): Promise<UserResponse | undefined> {

        const errResponse: UserResponse = {
            errors: []
        }

        if (!input.email) {
            errResponse.errors!.push({ field: "email", message: "Must provide an email" })
        }

        if (!input.username) {
            errResponse.errors!.push({ field: "username", message: "Must provide a username" })
        }

        if (!input.password) {
            errResponse.errors!.push({ field: "password", message: "Must provide a password" })
        }

        if (errResponse.errors!.length > 0) {
            return errResponse
        }

        if (!String(input.email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            errResponse.errors!.push({ field: "email", message: "Must be a valid email" })
        }

        if (input.username.length < 6) {
            errResponse.errors!.push({ field: "username", message: "Must be at least 6 chars long" })
        }

        if (input.password.length < 6) {
            errResponse.errors!.push({ field: "password", message: "Must be at least 6 chars long" })
        }

        if (errResponse.errors!.length > 0) {
            return errResponse
        }

        const hashedPassword = await argon2.hash(input.password);
        let saved;
        try {
            const user = User.create({
                username: input.username,
                email: input.email,
                password: hashedPassword
            })

            saved = await user.save()
        } catch (err) {
            if (err.code === "23505") {
                if (err.detail.includes("email")) {
                    return {
                        errors: [{ field: "email", message: "Email already exists" }]
                    }
                } else {
                    return {
                        errors: [{
                            field: "username",
                            message: "username already exists"
                        }]
                    }
                }
            } else {
                console.error(err);
            }
        }

        const token = jwt.sign({ _id: saved?.id }, "1234")

        return { user: saved, token }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        usernameOrEmail;
        password;
        req;
        const user = await User.findOne({ where: usernameOrEmail.includes("@") ? { email: usernameOrEmail } : { username: usernameOrEmail } })

        if (!user) {
            return {
                errors: [{
                    field: "usernameOrEmail",
                    message: "username or email not found"
                }]
            }
        }

        const valid = await argon2.verify(user.password, password);

        if (!valid) {
            return {
                errors: [{
                    field: 'password',
                    message: "incorrect password"
                }]
            }
        }


        const token = jwt.sign({ _id: user.id }, "1234")

        return { user, token };
    }

    @Mutation(() => Boolean)
    async logout(
    ): Promise<Boolean> {
        return true
    }

    @Mutation(() => String)
    @UseMiddleware(isAuth)
    async changePfp(@Ctx() { req }: MyContext, @Arg("pfp", () => String) pfp: string): Promise<String> {

        const user = await User.findOne(req.user)

        if (!user) {
            return ""
        }

        user.profilePicture = pfp;
        user.save()

        return pfp
    }

    @Mutation(() => User)
    @UseMiddleware(isAuth)
    async changeInfo(@Ctx() { req }: MyContext, @Arg("username", () => String) username: string, @Arg("email", () => String) email: string): Promise<User> {
        const user = await User.findOne(req.user)

        user!.email = email;
        user!.username = username;

        user?.save()

        return user!;
    }
}