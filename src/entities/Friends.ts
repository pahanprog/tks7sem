import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Post from "./Post";
import User from "./User";

@Entity()
@ObjectType()
class Friends extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User, (user) => user.incoming)
    recipient: User

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User, (user) => user.outgoing)
    sender: User

    @Column({ default: false })
    isMutual: boolean
}

export default Friends;