import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Friends from "./Friends";
import Post from "./Post";

@Entity()
@ObjectType()
class User extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field()
    @Column({ unique: true })
    username: string;

    @Field()
    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    profilePicture: string;

    @ManyToMany(() => Post, (post) => post.likes)
    liked: [Post]

    @OneToMany(() => Post, (post) => post.creator)
    posts: [Post]

    @OneToMany(() => Friends, (friends) => friends.sender)
    outgoing: [Friends]

    @OneToMany(() => Friends, (friends) => friends.recipient)
    incoming: [Friends]
}

export default User;