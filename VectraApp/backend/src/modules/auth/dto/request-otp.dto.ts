import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestOtpDto {
    @IsIn(['phone', 'email'])
    channel!: 'phone' | 'email';

    @IsString()
    @IsNotEmpty()
    identifier!: string; // phone number or email

    @IsOptional()
    @IsIn(['RIDER', 'DRIVER', 'ADMIN'])
    roleHint?: 'RIDER' | 'DRIVER' | 'ADMIN';
}
