import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'vehicles' })
export class VehicleEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid', { name: 'driver_user_id' })
    driverUserId!: string;

    @Column({ type: 'text', name: 'vehicle_type' })
    vehicleType!: string;

    @Column({ type: 'text', nullable: true })
    make!: string | null;

    @Column({ type: 'text', nullable: true })
    model!: string | null;

    @Column({ type: 'text', unique: true, name: 'plate_number' })
    plateNumber!: string;

    @Column({ type: 'int', name: 'seating_capacity' })
    seatingCapacity!: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, name: 'emission_factor_g_per_km' })
    emissionFactorGPerKm!: number | null;

    @Column({ type: 'boolean', default: true, name: 'is_active' })
    isActive!: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => UserEntity, (user) => user.vehicles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'driver_user_id' })
    driver!: UserEntity;
}
