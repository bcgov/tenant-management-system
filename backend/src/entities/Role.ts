import { Entity, PrimaryGeneratedColumn, Column, Timestamp, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { TenantUser } from './TenantUser'
import { Tenant } from './Tenant'
import { TenantUserRole } from './TenantUserRole'

@Entity('Role')
export class Role {

    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id:string

    @Column({ type: 'varchar', length: 100, name: 'name'})
    name: string
    
    @Column({ type: 'varchar', length: 255, name: 'description', nullable: true })
    description: string

    @ManyToOne(() => Tenant, (tenant) => tenant.roles, { nullable: true })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;
    
    @OneToMany(() => TenantUserRole, (tur) => tur.role)
    tenantUserRoles: TenantUserRole[];

    @CreateDateColumn({ type: 'timestamp', name: 'created_datetime' })
    createdDateTime : Timestamp

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_datetime' })
    updatedDateTime : Timestamp
}