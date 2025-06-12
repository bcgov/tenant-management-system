import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm'
import { TenantUser } from './TenantUser'

@Entity('SSOUser', { schema: 'tms' })
export class SSOUser {
    
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Index()
    @Column({ type: 'varchar', length:32, name: 'sso_user_id', unique: true})
    ssoUserId: string;

    @Column({ type: 'varchar', length: 50, name: 'first_name' })
    firstName: string;

    @Column({ type: 'varchar', length: 50, name: 'last_name'})
    lastName: string;

    @Column({ type: 'varchar', length: 50, name: 'display_name' })
    displayName: string;

    @Column({ type: 'varchar', length: 15, name: 'user_name', nullable: true })
    userName: string;

    @Column({ type: 'varchar', length: 100, name: 'email', unique: true})
    email: string;

    @OneToMany(() => TenantUser, (tenantUser) => tenantUser.ssoUser)
    tenantUsers: TenantUser[];

    @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
    createdDateTime: Date;

    @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
    updatedDateTime: Date;

    @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
    updatedBy: string;
}