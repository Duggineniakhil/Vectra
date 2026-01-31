import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export enum DriverVerificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

@Entity({ name: 'driver_profiles' })
export class DriverProfileEntity {
    @PrimaryColumn('uuid', { name: 'user_id' })
    userId!: string;

    @Column({
        type: 'enum',
        enum: DriverVerificationStatus,
        default: DriverVerificationStatus.PENDING,
        name: 'verification_status',
    })
    verificationStatus!: DriverVerificationStatus;

    @Column({ type: 'numeric', precision: 3, scale: 2, default: 0, name: 'rating_avg' })
    ratingAvg!: number;

    @Column({ type: 'int', default: 0, name: 'rating_count' })
    ratingCount!: number;

    @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, name: 'completion_rate' })
    completionRate!: number;

    @Column({ type: 'boolean', default: false, name: 'online_status' })
    onlineStatus!: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => UserEntity, (user) => user.driverProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;
}
