import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, RefreshDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Post('request-otp')
    @HttpCode(HttpStatus.OK)
    requestOtp(@Body() dto: RequestOtpDto) {
        return this.auth.requestOtp(dto.channel, dto.identifier);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.auth.verifyOtp(dto.identifier, dto.code);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body() dto: RefreshDto) {
        return this.auth.refresh(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Body() dto: RefreshDto) {
        return this.auth.logout(dto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: { user: { userId: string; role: string } }) {
        return this.auth.getMe(req.user.userId);
    }
}
