import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProfileEntity } from './driver-profile.entity';
import { DriverLocationHistoryEntity } from './driver-location-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DriverProfileEntity, DriverLocationHistoryEntity])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class DriversModule { }
