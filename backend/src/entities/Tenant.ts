import { Entity, PrimaryGeneratedColumn, Column, Timestamp, CreateDateColumn, UpdateDateColumn, OneToMany, Unique } from 'typeorm'
import { TenantUser } from './TenantUser'
import { Role } from './Role'

@Entity('Tenant')
@Unique(["name", "ministryName"])
export class Tenant {

      @PrimaryGeneratedColumn('uuid', { name: 'id' })
      id:string

      @Column({length:30, name:'name'})
      name:string

      @Column({length:100, name:'ministry_name'})
      ministryName:string

      @OneToMany(()=>TenantUser,(tenantUser) => tenantUser.tenant, {
        cascade:true,
      })
      users:TenantUser[]

      @OneToMany(() => Role, (role) => role.tenant, {
        cascade: true,
      })
      roles: Role[];

      @CreateDateColumn({ type: 'timestamp', name: 'created_datetime' })
      createdDateTime : Timestamp

      @UpdateDateColumn({ type: 'timestamp', name: 'updated_datetime' })
      updatedDateTime : Timestamp
}