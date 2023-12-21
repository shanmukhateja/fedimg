import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserController } from "../controllers/user.controller.js";
import { UserPublicKey } from "../models/api/user-keys.model.js";
import { Attachment, Tag } from "../models/user-info-response.model.js";

@Entity()
export class User extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    _id: number;

    @Column({unique: true})
    id: string;

    @Column({nullable: true})
    avatar: string;

    @Column({type: 'varchar'})
    type = 'Person'

    @Column()
    displayName: string;

    @Column({unique: true})
    preferredUsername: string;

    @ManyToMany(() => User)
    followers: User[];

    // FIXME: setup callbacks to increment/decrement this value.
    @Column({default: 0, type: 'bigint'})
    followingCount: number;

    @Column({type: 'json'})
    publicKey: UserPublicKey

    @Column({type: 'longtext'})
    privateKey: string;

    @Column({unique: true})
    email: string;

    @Column({type: 'longtext'})
    password: string;

    @Column({type: 'longtext'})
    tags: Tag[];
    
    @Column({type: 'longtext'})
    attachments: Attachment[];

    validPassword(password: string) {
        return UserController.validatePassword(this.preferredUsername, password);
    }
    
}