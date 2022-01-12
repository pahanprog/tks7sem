import { MyContext } from "../types";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class TestResolver {
    @Query(() => String)
    async test(
        @Ctx() { req }: MyContext
    ): Promise<String> {
        req;
        return "Test"
    }
}