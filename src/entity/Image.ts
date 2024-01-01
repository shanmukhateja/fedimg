import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { User } from "./User.js";
import { isTesting } from "../utils/misc.js";

@Entity()
export class Image extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    _id: number;

    @Column({type: 'varchar'})
    type = 'Image'

    @Column({type: isTesting() ? 'text' : 'longtext'})
    path: string;

    @Column({nullable: true})
    alt: string;

    @ManyToOne(() => User, u => u._id, {nullable: false})
    user: Relation<User>;

    @Column({type: 'datetime'})
    published: Date;
}