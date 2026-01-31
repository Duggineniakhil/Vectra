import {
    Inject,
    Injectable,
    UnauthorizedException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { REDIS } from '../../integrations/redis/redis.module';
import { UserEntity, UserRole, AccountStatus } from '../users/user.entity';
import { RefreshTokenEntity } from './refresh-token.entity';

function otpKey(identifier: string) {
    return `otp:${identifier}`;
}
function otpAttemptsKey(identifier: string) {
    return `otp_attempts:${identifier}`;
}
function otpCooldownKey(identifier: string) {
    return `otp_cooldown:${identifier}`;
}

@Injectable()
export class AuthService {
    constructor(
        @Inject(REDIS) private readonly redis: Redis,
        private readonly jwt: JwtService,
        @InjectRepository(UserEntity)
        private readonly users: Repository<UserEntity>,
        @InjectRepository(RefreshTokenEntity)
        private readonly refreshRepo: Repository<RefreshTokenEntity>,
    ) { }

    async requestOtp(channel: 'phone' | 'email', identifier: string) {
        // Cooldown to prevent spamming OTP requests
        const cooldownSeconds = Number(
            process.env.OTP_REQUEST_COOLDOWN_SECONDS || 30,
        );
        const cooldown = await this.redis.get(otpCooldownKey(identifier));
        if (cooldown) {
            throw new HttpException(
                'Please wait before requesting OTP again.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const ttlSeconds = Number(process.env.OTP_TTL_SECONDS || 300);

        // Generate 6-digit OTP
        const code = String(Math.floor(100000 + Math.random() * 900000));

        // Store hash in Redis (never store raw OTP)
        const codeHash = await bcrypt.hash(code, 10);
        await this.redis.set(otpKey(identifier), codeHash, 'EX', ttlSeconds);

        // Reset attempts and set cooldown
        await this.redis.del(otpAttemptsKey(identifier));
        await this.redis.set(
            otpCooldownKey(identifier),
            '1',
            'EX',
            cooldownSeconds,
        );

        // For dev: return OTP in response for easy testing
        // In production: send via SMS/email provider
        const isDev = (process.env.NODE_ENV || 'development') !== 'production';
        return {
            success: true,
            channel,
            identifier,
            expiresInSeconds: ttlSeconds,
            ...(isDev ? { devOtp: code } : {}),
        };
    }

    async verifyOtp(identifier: string, code: string, roleHint?: UserRole) {
        const hash = await this.redis.get(otpKey(identifier));
        if (!hash) {
            throw new UnauthorizedException('OTP expired or not requested.');
        }

        // Check attempt limits
        const maxAttempts = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 5);
        const attempts = Number(
            (await this.redis.get(otpAttemptsKey(identifier))) || 0,
        );
        if (attempts >= maxAttempts) {
            throw new HttpException(
                'Too many attempts. Request OTP again.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const ok = await bcrypt.compare(code, hash);
        if (!ok) {
            await this.redis.incr(otpAttemptsKey(identifier));
            await this.redis.expire(
                otpAttemptsKey(identifier),
                Number(process.env.OTP_TTL_SECONDS || 300),
            );
            throw new UnauthorizedException('Invalid OTP.');
        }

        // OTP is correct => remove it (one-time use)
        await this.redis.del(otpKey(identifier));
        await this.redis.del(otpAttemptsKey(identifier));

        // Create or find user
        const isEmail = identifier.includes('@');
        let user = await this.users.findOne({
            where: isEmail ? { email: identifier } : { phone: identifier },
        });

        if (!user) {
            user = this.users.create({
                role: roleHint || UserRole.RIDER,
                email: isEmail ? identifier : null,
                phone: isEmail ? null : identifier,
                status: AccountStatus.ACTIVE,
            });
            user = await this.users.save(user);
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.users.save(user);

        // Issue tokens
        const tokens = await this.issueTokens(user.id, user.role);

        return {
            user: {
                id: user.id,
                role: user.role,
                email: user.email,
                phone: user.phone,
                name: user.name,
            },
            ...tokens,
        };
    }

    private async issueTokens(userId: string, role: UserRole) {
        const accessExpiresIn = this.parseExpiryToSeconds(
            process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        );
        const refreshExpiresIn = this.parseExpiryToSeconds(
            process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        );

        const accessToken = this.jwt.sign(
            { sub: userId, role },
            {
                secret: process.env.JWT_ACCESS_SECRET as string,
                expiresIn: accessExpiresIn,
            },
        );

        // Refresh token is a JWT too (separate secret + longer expiry)
        const refreshTokenRaw = this.jwt.sign(
            { sub: userId, role, typ: 'refresh' },
            {
                secret: process.env.JWT_REFRESH_SECRET as string,
                expiresIn: refreshExpiresIn,
            },
        );

        // Store hash of refresh token in DB (so we can revoke)
        const tokenHash = await bcrypt.hash(refreshTokenRaw, 10);

        // Compute expiry date
        const expiresAt = new Date(
            Date.now() +
            this.parseExpiryToMs(process.env.JWT_REFRESH_EXPIRES_IN || '30d'),
        );

        await this.refreshRepo.save(
            this.refreshRepo.create({
                userId,
                tokenHash,
                expiresAt,
                revokedAt: null,
            }),
        );

        return { accessToken, refreshToken: refreshTokenRaw };
    }

    async refresh(refreshToken: string) {
        // Verify refresh JWT
        let payload: { sub: string; role: UserRole; typ: string };
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token.');
        }

        if (payload.typ !== 'refresh') {
            throw new UnauthorizedException('Invalid token type.');
        }

        // Find matching token hash in DB
        const tokens = await this.refreshRepo.find({
            where: { userId: payload.sub },
        });

        // Locate a valid stored hash
        const match = await this.findMatchingRefreshToken(tokens, refreshToken);
        if (!match) {
            throw new UnauthorizedException('Refresh token revoked or not found.');
        }
        if (match.revokedAt) {
            throw new UnauthorizedException('Refresh token revoked.');
        }
        if (match.expiresAt.getTime() < Date.now()) {
            throw new UnauthorizedException('Refresh token expired.');
        }

        // Rotate token: revoke old, issue new
        match.revokedAt = new Date();
        await this.refreshRepo.save(match);

        return this.issueTokens(payload.sub, payload.role);
    }

    async logout(refreshToken: string) {
        // Revoke refresh token if found
        const decoded = this.safeDecodeRefresh(refreshToken);
        if (!decoded?.sub) return { success: true };

        const tokens = await this.refreshRepo.find({
            where: { userId: decoded.sub },
        });
        const match = await this.findMatchingRefreshToken(tokens, refreshToken);
        if (match && !match.revokedAt) {
            match.revokedAt = new Date();
            await this.refreshRepo.save(match);
        }
        return { success: true };
    }

    async getMe(userId: string) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found.');
        }
        return {
            id: user.id,
            role: user.role,
            email: user.email,
            phone: user.phone,
            name: user.name,
            status: user.status,
            createdAt: user.createdAt,
        };
    }

    private async findMatchingRefreshToken(
        tokens: RefreshTokenEntity[],
        raw: string,
    ): Promise<RefreshTokenEntity | null> {
        for (const t of tokens) {
            if (t.revokedAt) continue;
            const ok = await bcrypt.compare(raw, t.tokenHash);
            if (ok) return t;
        }
        return null;
    }

    private safeDecodeRefresh(token: string): { sub: string } | null {
        try {
            // Decode without verify to get sub for DB lookup
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            // Replace - with + and _ with / to handle base64url
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(
                Buffer.from(base64, 'base64').toString('utf8'),
            );
            return payload;
        } catch {
            return null;
        }
    }

    private parseExpiryToSeconds(exp: string): number {
        // Supports "15m", "30d", "12h"
        const m = exp.match(/^(\d+)([smhd])$/);
        if (!m) return 30 * 24 * 60 * 60; // default 30d in seconds
        const n = Number(m[1]);
        const unit = m[2];
        const mult =
            unit === 's'
                ? 1
                : unit === 'm'
                    ? 60
                    : unit === 'h'
                        ? 3600
                        : 86400; // d
        return n * mult;
    }

    private parseExpiryToMs(exp: string): number {
        // Supports "15m", "30d", "12h"
        const m = exp.match(/^(\d+)([smhd])$/);
        if (!m) return 30 * 24 * 60 * 60 * 1000; // default 30d
        const n = Number(m[1]);
        const unit = m[2];
        const mult =
            unit === 's'
                ? 1000
                : unit === 'm'
                    ? 60_000
                    : unit === 'h'
                        ? 3_600_000
                        : 86_400_000; // d
        return n * mult;
    }
}
