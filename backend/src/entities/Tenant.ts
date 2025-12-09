import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Unique } from 'typeorm'
import { TenantUser } from './TenantUser'
import { Role } from './Role'

@Entity('Tenant', { schema: 'tms' })
@Unique(["name", "ministryName"])
export class Tenant {

      @PrimaryGeneratedColumn('uuid', { name: 'id' })
      id!: string;

      @Column({length:30, name:'name'})
      name!: string;

      @Column({length:100, name:'ministry_name'})
      ministryName!: string;

      @Column({ type: 'varchar', length: 500, name: 'description', nullable: true })
      description!: string;

      @OneToMany(()=>TenantUser,(tenantUser) => tenantUser.tenant, {
        cascade:true,
      })
      users!: TenantUser[];

      @CreateDateColumn({ type: 'date', name: 'created_datetime', nullable: true })
      createdDateTime!: Date;

      @UpdateDateColumn({ type: 'date', name: 'updated_datetime', nullable: true })
      updatedDateTime!: Date;

      @Column({ type: 'char', length: 32, name: 'created_by', nullable: true })
      createdBy!: string;

      @Column({ type: 'char', length: 32, name: 'updated_by', nullable: true })
      updatedBy!: string;
}