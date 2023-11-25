import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

class UserPublicKey {
    id: string;
    owner: string;
    publicKeyPem: string;
}

@Entity()
export class User extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    _id: number;

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
}