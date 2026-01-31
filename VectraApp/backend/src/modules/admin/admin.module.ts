import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './audit-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AuditLogEntity])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class AdminModule { }
