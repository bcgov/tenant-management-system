import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { SSOUser } from './SSOUser'

@Entity('TenantRequest', { schema: 'tms' })
export class TenantRequest {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ length: 30, name: 'name' })
    name: string;

    @Column({ length: 100, name: 'ministry_name' })
    ministryName: string;

    @Column({ type: 'varchar', length: 500, name: 'description', nullable: true })
    description: string;

    @Index()
    @Column({ 
        type: 'enum', 
        enum: ['NEW', 'APPROVED', 'REJECTED'],
        name: 'status',
        default: 'NEW'
    })
    status: 'NEW' | 'APPROVED' | 'REJECTED';

    @Index()
    @ManyToOne(() => SSOUser, { eager: true, cascade:['insert'] })
    @JoinColumn({ name: 'requested_by' })
    requestedBy: SSOUser;

    @CreateDateColumn({ type: 'date', name: 'requested_at' })
    requestedAt: Date;

    @Index()
    @ManyToOne(() => SSOUser, { eager: true, nullable: true })
    @JoinColumn({ name: 'decisioned_by' })
    decisionedBy: SSOUser;

    @Column({ type: 'date', name: 'decisioned_at', nullable: true })
    decisionedAt: Date;

    @Column({ type: 'varchar', length: 500, name: 'rejection_reason', nullable: true })
    rejectionReason: string;

    @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
    createdDateTime: Date;

    @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
    updatedDateTime: Date;

    @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
    updatedBy: string;
} 