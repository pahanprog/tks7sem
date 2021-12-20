import { MyContext } from "src/constants";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class TestResolver {
    @Query(() => String)
    async test(
        @Ctx() { req }: MyContext
    ): Promise<String> {
        return "Test"
    }
}