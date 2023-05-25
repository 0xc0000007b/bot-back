import {BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Topping} from "./Topping";

@Entity()
export class Pizza extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column({ default: '' })
    type: string;
    @Column({ default: '' })
    orderDate: string;
    @Column({ default: '' })
    orderTime: string;
    @ManyToMany(() => Topping)
    @JoinTable()
    toppings: Topping[];
}
