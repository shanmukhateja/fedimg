import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export class UserPublicKey {
    id: string;
    owner: string;
    publicKeyPem: string;
}

@Entity()
export class User extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    _id: number;

    @Column({unique: true})
    id: string;

    @Column({type: 'varchar'})
    type = 'Person'

    @Column()
    displayName: string;

    @Column({unique: true})
    preferredUsername: string;

    @Column()
    followers: string

    @Column({type: 'json'})
    publicKey: UserPublicKey

    @Column({unique: true})
    email: string;

    @Column({type: 'longtext'})
    password: string
}