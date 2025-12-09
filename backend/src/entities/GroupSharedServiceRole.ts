import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Column, Index, Unique } from 'typeorm';
import { Group } from './Group';
import { SharedServiceRole } from './SharedServiceRole';

@Entity('GroupSharedServiceRole', { schema: 'tms' })
@Unique(["group", "sharedServiceRole"])
@Index("idx_groupsharedservicerole_access", ["group", "sharedServiceRole", "isDeleted"])
export class GroupSharedServiceRole {
    
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => Group, (group) => group.sharedServiceRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @Index()
  @ManyToOne(() => SharedServiceRole, (sharedServiceRole) => sharedServiceRole.groupAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_service_role_id' })
  sharedServiceRole!: SharedServiceRole;

  @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
  createdDateTime!: Date;
  
  @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
  updatedDateTime!: Date;

  @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
  createdBy!: string;

  @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
  updatedBy!: string;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted!: boolean;
} 