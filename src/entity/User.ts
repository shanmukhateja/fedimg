import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserController } from "../controllers/user.controller.js";
import { UserPublicKey } from "../models/api/user-keys.model.js";
import { Attachment, Icon, Tag } from "../models/user-info-response.model.js";
import { isTesting } from "../utils/misc.js";
import { FediBaseEntity } from "./Base.js";

@Entity()
export class User extends FediBaseEntity {

    @PrimaryGeneratedColumn()
    _id: number;

    @Column({ unique: true })
    id: string;

    // FIXME: should be `string` in case of lookupUser
    @Column({ nullable: true, type: isTesting() ? 'text' : 'longtext' })
    avatar: Icon;

    @Column({ type: 'varchar' })
    type = 'Person'

    @Column()
    displayName: string;

    @Column({ unique: true })
    preferredUsername: string;

    @ManyToMany(() => User)
    @JoinTable()
    followers: User[];

    // FIXME: setup callbacks to increment/decrement this value.
    @Column({ default: 0, type: 'bigint' })
    followingCount: number;

    @Column({ type: 'json' })
    publicKey: UserPublicKey

    @Column({ type: isTesting() ? 'text' : 'longtext', nullable: true })
    privateKey: string;

    @Column({ unique: true })
    email: string;

    // email given to register account 
    @Column({ unique: true })
    recovery_email: string;

    @Column({ type: isTesting() ? 'text' : 'longtext' })
    password: string;

    @Column({ type: isTesting() ? 'text' : 'longtext', nullable: true, default: null })
    tags: Tag[];

    @Column({ type: isTesting() ? 'text' : 'longtext', nullable: true, default: null })
    attachments: Attachment[];

    @Column({ default: true })
    isLocal: boolean;

    // @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    // createdAt: Date;

    // @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    // updatedAt: Date;

    validPassword(password: string) {
        return UserController.validatePasswordByUsername(this.preferredUsername, password);
    }

}