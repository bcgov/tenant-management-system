import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Column, Index } from 'typeorm';
import { TenantUser } from './TenantUser';
import { Role } from './Role';

@Entity('TenantUserRole', { schema: 'tms' })
@Index("idx_tenantuserrole_access", ["tenantUser", "role", "isDeleted"])
export class TenantUserRole {
    
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantUser, (tenantUser) => tenantUser.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_user_id' })
  tenantUser: TenantUser;

  @ManyToOne(() => Role, (role) => role.tenantUserRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
  createdDateTime: Date;
  
  @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
  updatedDateTime: Date;

  @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
  updatedBy: string;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;
}