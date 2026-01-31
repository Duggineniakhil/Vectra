import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideRequestEntity } from './ride-request.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RideRequestEntity])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class RideRequestsModule { }
