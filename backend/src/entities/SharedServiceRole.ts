import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm'
import { SharedService } from './SharedService'
import { GroupSharedServiceRole } from './GroupSharedServiceRole'

@Entity('SharedServiceRole', { schema: 'tms' })
@Unique(["name", "sharedService"])
export class SharedServiceRole {

    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ type: 'varchar', length: 30, name: 'name' })
    name: string;
    
    @Column({ type: 'varchar', length: 255, name: 'description', nullable: true })
    description: string;
    
    @Column({ type: 'boolean', name: 'is_deleted', default: false })
    isDeleted: boolean;

    @ManyToOne(() => SharedService, (sharedService) => sharedService.roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shared_service_id' })
    sharedService: SharedService;

    @OneToMany(() => GroupSharedServiceRole, (groupSharedServiceRole) => groupSharedServiceRole.sharedServiceRole, {
        cascade: true,
    })
    groupAssignments: GroupSharedServiceRole[];

    @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
    createdDateTime: Date;

    @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
    updatedDateTime: Date;

    @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
    updatedBy: string;
} 