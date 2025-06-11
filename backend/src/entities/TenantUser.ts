import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm'
import { Tenant } from './Tenant'
import { SSOUser } from './SSOUser'
import {TenantUserRole} from './TenantUserRole'

@Entity('TenantUser', { schema: 'tms' })
export class TenantUser {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => SSOUser,{eager:true, cascade:['insert']})
    @JoinColumn({ name: 'sso_id' })
    ssoUser: SSOUser;

    @Index()
    @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;
  
    @OneToMany(() => TenantUserRole, (tur) => tur.tenantUser, {
        cascade: true,
    })
    roles: TenantUserRole[];

    @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
    createdDateTime: Date;

    @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
    updatedDateTime: Date;

    @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
    updatedBy: string;
}