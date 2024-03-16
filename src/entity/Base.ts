import { BaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class FediBaseEntity extends BaseEntity {

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;

}