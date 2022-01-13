import { MyContext } from "../types";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { FieldError } from "./User";
import Post from "../entities/Post";
import User from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import Friends from "../entities/Friends";
import { getConnection, In } from "typeorm";


@InputType()
class PostInput {
    @Field()
    title: string;

    @Field()
    body: string;

    @Field({ nullable: true })
    picture?: string;
}

@ObjectType()
class PostResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => Post, { nullable: true })
    post?: Post

}

@Resolver(() => Post)
export class PostResolver {

    @FieldResolver(() => Boolean)
    isLiked(@Root() post: Post, @Ctx() { req }: MyContext): boolean {

        if (!post.likes) {
            return false
        }
        let result = false;
        post.likes.forEach(l => {
            if (l.id === req.user) {
                result = true
            }
        })
        return result;
    }

    @Mutation(() => PostResponse, { nullable: true })
    @UseMiddleware(isAuth)
    async createPost(@Ctx() { req }: MyContext, @Arg("input", () => PostInput) input: PostInput): Promise<PostResponse | undefined> {
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
            }
        } else if (!input.body) {
            return {
                errors: [{
                    field: "body",
                    message: "post must have a body"
                }]
            }
        } else if (!input.title) {
            return {
                errors: [
                    {
                        field: "title",
                        message: "post must have a title"
                    }]
            }
        } else {


            const user = await User.findOne(req.user, { relations: ["posts"] });

            const post = await Post.create({
                body: input.body,
                title: input.title,
                picture: input.picture,
            }).save()

            user!.posts.push(post)

            user?.save();

            post.likeCount = 0
            post.creator = user!

            return {
                post
            }
        }
    }

    @Mutation(() => PostResponse)
    @UseMiddleware(isAuth)
    async editPost(@Arg("id", () => Int) id: number, @Arg("input", () => PostInput) input: PostInput, @Ctx() { req }: MyContext): Promise<PostResponse | undefined> {

        const post = await Post.findOne(id, { relations: ["creator"] })

        if (!post) {
            return {
                errors: [{ field: "id", message: "id does not match a post" }]
            }
        }

        if (post.creator.id !== req.user) {
            return {
                errors: [{ field: "creator", message: "you are not the creator of this post" }]
            }
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
            }
        } else if (!input.body) {
            return {
                errors: [{
                    field: "body",
                    message: "post must have a body"
                }]
            }
        } else if (!input.title) {
            return {
                errors: [
                    {
                        field: "title",
                        message: "post must have a title"
                    }]
            }
        } else {
            post.body = input.body
            post.title = input.title
            if (input.picture)
                post.picture = input.picture
            post.isEdited = true;
            const saved = await post.save()
            return {
                post: saved
            }
        }
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(@Arg("id", () => Int) id: number, @Ctx() { req }: MyContext): Promise<boolean> {
        const post = await Post.findOne(id, { relations: ["creator"] });
        if (!post) {
            return false;
        }

        if (post.creator.id !== req.user) {
            return false
        }

        const deleted = await post.remove();

        return true;
    }

    @Mutation(() => Int)
    @UseMiddleware(isAuth)
    async likePost(@Arg("id", () => Int) id: number, @Ctx() { req }: MyContext): Promise<number> {
        const user = await User.findOne(req.user)
        const post = await Post.findOne(id, { relations: ["likes"] })

        if (!user || !post) {
            return -1;
        }

        post.likes.push(user)

        post.save()

        return post.likes.length
    }

    @Mutation(() => Int)
    @UseMiddleware(isAuth)
    async unlikePost(@Arg("id", () => Int) id: number, @Ctx() { req }: MyContext): Promise<number> {
        const post = await Post.findOne(id, { relations: ["likes"] })

        if (!post) {
            return -1;
        }

        const filtered = post.likes.filter((i) => { return i.id !== req.user }) as [User]

        post.likes = filtered;

        post.save()

        return post.likes.length
    }

    @Query(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async getPostById(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        const post = await Post.findOne(id, { relations: ["likes"] });
        if (post) {
            post.likeCount = post.likes.length
        }
        return post
    }

    @Query(() => [Post])
    @UseMiddleware(isAuth)
    async getFeed(@Ctx() { req }: MyContext): Promise<Post[]> {
        const user = await User.findOne(req.user)

        const friends = await Friends.find({ where: [{ sender: user, isMutual: true }, { recipient: user, isMutual: true }], relations: ["recipient", "sender"] })

        const ids: Array<number> = []

        ids.push(user!.id)

        friends.forEach(i => {
            console.log(i)
            if (i.sender.id === user!.id) {
                ids.push(i.recipient.id)
            } else {
                ids.push(i.sender.id)
            }
        })

        console.log(ids)

        const posts = await getConnection().getRepository(Post).createQueryBuilder("p").leftJoinAndSelect("p.likes", "l").leftJoinAndSelect("p.creator", "c").where("p.creatorId = ANY(:ids)", { ids: ids }).orderBy("p.createdAt", "DESC").getMany()

        posts.forEach(i => {
            i.likeCount = i.likes.length;
        })

        return posts;
    }
}