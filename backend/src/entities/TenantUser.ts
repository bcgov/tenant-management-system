import { Entity, PrimaryGeneratedColumn, Column, Timestamp, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm'
import { Tenant } from './Tenant'
import { SSOUser } from './SSOUser'
import {TenantUserRole} from './TenantUserRole'

@Entity('TenantUser')
export class TenantUser {

    @PrimaryGeneratedColumn('uuid')
    id:string

    @Index()
    @ManyToOne(() => SSOUser,{eager:true, cascade:['insert']})
    @JoinColumn({ name: 'sso_id' })
    ssoUser: SSOUser

    @Index()
    @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant
  
    @OneToMany(() => TenantUserRole, (tur) => tur.tenantUser, {
        cascade: true,
    })
    roles: TenantUserRole[];

    @CreateDateColumn({ type: 'timestamp', name: 'created_datetime' })
    createdDateTime : Timestamp

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_datetime' })
    updatedDateTime: Timestamp

}