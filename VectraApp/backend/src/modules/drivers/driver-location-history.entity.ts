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
import { GeoPoint } from '../../common/types/geo-point.type';

/**
 * Stores historical driver location data for analytics and debugging.
 * Real-time location should be in Redis, but this table stores sampled history.
 */
@Entity({ name: 'driver_location_history' })
export class DriverLocationHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid', { name: 'driver_user_id' })
    driverUserId!: string;

    @Index('idx_driver_location_history_point_gist', { spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    point!: GeoPoint;

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'speed_kph' })
    speedKph!: number | null;

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
    heading!: number | null; // Direction in degrees (0-360)

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
    accuracy!: number | null; // GPS accuracy in meters

    @CreateDateColumn({ type: 'timestamptz', name: 'recorded_at' })
    recordedAt!: Date;

    // Relations
    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'driver_user_id' })
    driver!: UserEntity;
}
