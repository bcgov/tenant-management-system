import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { SharedServiceRole } from './SharedServiceRole'

@Entity('SharedService', { schema: 'tms' })
export class SharedService {

    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ type: 'varchar', length: 30, name: 'name', unique: true })
    name: string;
    
    @Column({ type: 'varchar', length: 500, name: 'description', nullable: true })
    description: string;
    
    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => SharedServiceRole, (sharedServiceRole) => sharedServiceRole.sharedService, {
        cascade: true,
    })
    roles: SharedServiceRole[];

    @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
    createdDateTime: Date;

    @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
    updatedDateTime: Date;

    @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
    updatedBy: string;
} 