import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.js";

@Entity()
export class Image extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    _id: number;

    @Column({type: 'varchar'})
    type = 'Image'

    @Column({type: 'longtext'})
    path: string;

    @ManyToOne(() => User, u => u._id, {nullable: false})
    user: User;

    @Column({type: 'datetime'})
    published: Date;
}