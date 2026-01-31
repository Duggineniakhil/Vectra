import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';

export enum UserRole {
    RIDER = 'RIDER',
    DRIVER = 'DRIVER',
    ADMIN = 'ADMIN',
}

export enum AccountStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DELETED = 'DELETED',
}

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: UserRole })
    role!: UserRole;

    @Column({ type: 'text', unique: true, nullable: true })
    email!: string | null;

    @Column({ type: 'text', unique: true, nullable: true })
    phone!: string | null;

    @Column({ type: 'text', nullable: true, name: 'password_hash' })
    passwordHash!: string | null;

    @Column({ type: 'text', nullable: true })
    name!: string | null;

    @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
    status!: AccountStatus;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
    lastLoginAt!: Date | null;

    // Relations use string references to avoid circular dependencies
    @OneToOne('DriverProfileEntity', 'user')
    driverProfile?: unknown;

    @OneToMany('VehicleEntity', 'driver')
    vehicles?: unknown[];

    @OneToMany('RideRequestEntity', 'rider')
    rideRequests?: unknown[];

    @OneToMany('TripEntity', 'driver')
    driverTrips?: unknown[];

    @OneToMany('TripRiderEntity', 'rider')
    tripRiders?: unknown[];

    @OneToMany('AuditLogEntity', 'actor')
    actorAuditLogs?: unknown[];

    @OneToMany('AuditLogEntity', 'target')
    targetAuditLogs?: unknown[];
}
