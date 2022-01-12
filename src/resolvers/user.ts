import User from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "src/types";
import { getConnection } from "typeorm";

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

}

@Resolver(() => User)
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req }: MyContext) {
        if (!req.session!.userId) {
            return null;
        }
        const user = await getConnection().manager.findOne(User, {
            where: { id: req.session.userId }
        })
        return user;
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

        if (saved) {
            req.session.userId = saved.id
        }

        return { user: saved }
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

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    async logout(
        @Ctx() { req, res }: MyContext
    ): Promise<Boolean> {
        req.session.destroy((err) => {
            if (err) {
                console.error(err)
            }
        })
        res.clearCookie("qid");
        return true
    }

    @Mutation(() => String)
    async changePfp(@Ctx() { req }: MyContext, @Arg("pfp", () => String) pfp: string): Promise<String> {
        const user = await User.findOne(req.session.userId)

        if (!user) {
            return ""
        }

        user.profilePicture = pfp;
        user.save()

        return pfp
    }

    @Mutation(() => User)
    async changeInfo(@Ctx() { req }: MyContext, @Arg("username", () => String) username: string, @Arg("email", () => String) email: string): Promise<User> {
        const user = await User.findOne(req.session.userId)

        user!.email = email;
        user!.username = username;

        user?.save()

        return user!;
    }
}