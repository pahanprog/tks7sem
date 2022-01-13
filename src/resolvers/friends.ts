import { MyContext } from "../types";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import Friends from "../entities/Friends";
import User from "../entities/User";
import { getConnection, Not } from "typeorm";


@Resolver(() => Friends)
export class FriendsResolver {

    @Mutation(() => Boolean, { nullable: true })
    @UseMiddleware(isAuth)
    async sendFriendRequest(@Arg("id", () => Int) id: number, @Ctx() { req }: MyContext): Promise<boolean> {

        const sender = await User.findOne(req.user, { relations: ["outgoing", "outgoing.recipient"] })
        const recipient = await User.findOne(id, { relations: ["incoming", "incoming.sender"] })

        if (!sender || !recipient) {
            return false
        }

        const exists = await Friends.findOne({ where: { sender, recipient } })

        if (exists) {
            console.log("ALREADY EXISTS")
            return true
        }

        const request = await Friends.create({
            sender,
            recipient,
            isMutual: false,
        }).save()

        if (!request.id) {
            return false
        }

        return true
    }


    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async sendFriendResponse(@Arg("id", () => Int) id: number, @Ctx() { req }: MyContext): Promise<boolean> {
        const recipient = await User.findOne(req.user)
        const sender = await User.findOne(id)
        const request = await Friends.findOne({ where: { sender, recipient } })

        console.log(id, recipient, request)

        if (!request) {
            return false
        }

        request.isMutual = true;
        request.save();

        return true
    }

    @Query(() => [Friends])
    @UseMiddleware(isAuth)
    async getFriendList(@Ctx() { req }: MyContext) {
        const user = await User.findOne(req.user);

        const incoming = await Friends.find({ where: { recipient: user, isMutual: true }, relations: ["sender"] })

        const outgoing = await Friends.find({ where: { sender: user, isMutual: true }, relations: ["recipient"] })

        const friends = incoming.concat(outgoing)

        return friends
    }

    @Query(() => [Friends])
    @UseMiddleware(isAuth)
    async getIncomingRequests(@Ctx() { req }: MyContext) {
        const user = await User.findOne(req.user);

        const incoming = await Friends.find({ where: { recipient: user, isMutual: false }, relations: ["sender"] })

        return incoming
    }

    @Query(() => [Friends])
    @UseMiddleware(isAuth)
    async getOutgoingRequests(@Ctx() { req }: MyContext) {
        const user = await User.findOne(req.user);

        const outgoing = await Friends.find({ where: { sender: user, isMutual: false }, relations: ["recipient"] })

        return outgoing
    }

    @Query(() => [User])
    @UseMiddleware(isAuth)
    async getAllUsers(@Ctx() { req }: MyContext) {

        const user = await User.findOne(req.user);

        const friends = await Friends.find({ where: [{ sender: user, isMutual: true }, { recipient: user, isMutual: true }], relations: ["recipient", "sender"] })

        const ids = [user!.id]

        friends.forEach(i => {
            if (i.sender.id === user!.id) {
                ids.push(i.recipient.id)
            } else {
                ids.push(i.sender.id)
            }
        })

        const users = await getConnection().getRepository(User).createQueryBuilder("u").where("NOT u.id = ANY(:ids)", { ids: ids }).getMany()

        return users
    }
}