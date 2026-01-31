import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from './trip.entity';
import { TripRiderEntity } from './trip-rider.entity';
import { TripEventEntity } from './trip-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TripEntity, TripRiderEntity, TripEventEntity])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class TripsModule { }
