import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    // Store a hash, never store the raw token
    @Column({ type: 'text', name: 'token_hash' })
    tokenHash!: string;

    @Column({ type: 'timestamptz', name: 'expires_at' })
    expiresAt!: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
    revokedAt!: Date | null;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    // Relations
    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;
}
