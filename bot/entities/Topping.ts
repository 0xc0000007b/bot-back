import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Topping extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column()
    type: string;
}
