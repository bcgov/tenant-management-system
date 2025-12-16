import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { TenantUser } from './TenantUser'
import { Group } from './Group'

@Entity('GroupUser', { schema: 'tms' })
export class GroupUser {

    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id!: string;

    @Index()
    @ManyToOne(() => TenantUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_user_id' })
    tenantUser!: TenantUser;

    @Index()
    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group!: Group;

    @Column({ type: 'boolean', name: 'is_deleted', default: false, nullable: true })
    isDeleted!: boolean;

    @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
    createdDateTime!: Date;

    @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
    updatedDateTime!: Date;

    @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
    createdBy!: string;

    @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
    updatedBy!: string;
} 