import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid', { nullable: true, name: 'actor_user_id' })
    actorUserId!: string | null;

    @Column('uuid', { nullable: true, name: 'target_user_id' })
    targetUserId!: string | null;

    @Column({ type: 'text', name: 'action_type' })
    actionType!: string;

    @Column({ type: 'text', nullable: true })
    reason!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: Record<string, unknown> | null;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    // Relations
    @ManyToOne(() => UserEntity, (user) => user.actorAuditLogs, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'actor_user_id' })
    actor!: UserEntity | null;

    @ManyToOne(() => UserEntity, (user) => user.targetAuditLogs, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'target_user_id' })
    target!: UserEntity | null;
}
