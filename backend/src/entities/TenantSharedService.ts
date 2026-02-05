import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm'
import { Tenant } from './Tenant'
import { SharedService } from './SharedService'

@Entity('TenantSharedService', { schema: 'tms' })
@Unique(['tenant', 'sharedService'])
export class TenantSharedService {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant

  @ManyToOne(() => SharedService, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_service_id' })
  sharedService!: SharedService

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted!: boolean

  @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
  createdDateTime!: Date

  @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
  updatedDateTime!: Date

  @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
  createdBy!: string

  @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
  updatedBy!: string
}
