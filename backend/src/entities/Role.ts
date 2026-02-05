import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { TenantUserRole } from './TenantUserRole'

@Entity('Role', { schema: 'tms' })
export class Role {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string

  @Column({ type: 'varchar', length: 100, name: 'name' })
  name!: string

  @Column({ type: 'varchar', length: 255, name: 'description', nullable: true })
  description!: string

  @OneToMany(() => TenantUserRole, (tur) => tur.role)
  tenantUserRoles!: TenantUserRole[]

  @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
  createdDateTime!: Date

  @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
  updatedDateTime!: Date

  @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
  createdBy!: string

  @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
  updatedBy!: string
}
