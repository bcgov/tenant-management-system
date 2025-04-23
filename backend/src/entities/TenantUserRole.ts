import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn,CreateDateColumn,UpdateDateColumn,Timestamp } from 'typeorm';
import { TenantUser } from './TenantUser';
import { Role } from './Role';

@Entity('TenantUserRole')
export class TenantUserRole {
    
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantUser, (tenantUser) => tenantUser.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_user_id' })
  tenantUser: TenantUser;

  @ManyToOne(() => Role, (role) => role.tenantUserRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({ type: 'timestamp', name: 'created_datetime' })
  createdDateTime : Timestamp
  
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_datetime' })
  updatedDateTime : Timestamp

}