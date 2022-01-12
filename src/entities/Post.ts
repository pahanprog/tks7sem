import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import User from "./User";

@Entity()
@ObjectType()
class Post extends BaseEntity {
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
    @Column()
    title: string;

    @Field()
    @Column()
    body: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    picture: string;

    @Field()
    @Column({ default: false })
    isEdited: boolean

    @ManyToMany(() => User, (user) => user.liked)
    @JoinTable()
    likes: [User];

    @Field()
    likeCount: number

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.posts)
    creator: User
}

export default Post;