import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm'
import { Tenant } from './Tenant'
import { GroupUser } from './GroupUser'
import { GroupSharedServiceRole } from './GroupSharedServiceRole'

@Entity('Group', { schema: 'tms' })
@Unique(['name', 'tenant'])
export class Group {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string

  @Column({ type: 'varchar', length: 30, name: 'name' })
  name!: string

  @Column({ type: 'varchar', length: 500, name: 'description', nullable: true })
  description!: string

  @Index()
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant

  @OneToMany(() => GroupUser, (groupUser) => groupUser.group, {
    cascade: true,
  })
  users!: GroupUser[]

  @OneToMany(
    () => GroupSharedServiceRole,
    (groupSharedServiceRole) => groupSharedServiceRole.group,
    {
      cascade: true,
    },
  )
  sharedServiceRoles!: GroupSharedServiceRole[]

  @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
  createdDateTime!: Date

  @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
  updatedDateTime!: Date

  @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
  createdBy!: string

  @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
  updatedBy!: string
}
