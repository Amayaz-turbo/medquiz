import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { env } from "../config/env";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthRepository } from "./auth.repository";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthUserResponse = {
  id: string;
  email: string;
  displayName: string;
};

@Injectable()
export class AuthService {
  private readonly cfg = env();

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepo: AuthRepository
  ) {}

  async register(
    dto: RegisterDto,
    meta: { userAgent: string | null; ipAddress: string | null }
  ): Promise<{ user: AuthUserResponse; tokens: TokenPair }> {
    const email = dto.email.toLowerCase();
    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.authRepo.createUserWithPassword({
        email,
        displayName: dto.displayName.trim(),
        passwordHash
      });
      const tokens = await this.issueTokenPair({
        userId: user.id,
        email: user.email,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name
        },
        tokens
      };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email is already registered"
        });
      }
      throw error;
    }
  }

  async login(
    dto: LoginDto,
    meta: { userAgent: string | null; ipAddress: string | null }
  ): Promise<{ user: AuthUserResponse; tokens: TokenPair }> {
    const email = dto.email.toLowerCase();
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
      });
    }

    const passwordHash = await this.authRepo.getPasswordHash(user.id);
    if (!passwordHash) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
      });
    }

    let passwordOk = false;
    try {
      passwordOk = await argon2.verify(passwordHash, dto.password);
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
      });
    }
    if (!passwordOk) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
      });
    }

    const tokens = await this.issueTokenPair({
      userId: user.id,
      email: user.email,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      },
      tokens
    };
  }

  async refresh(
    dto: RefreshDto,
    meta: { userAgent: string | null; ipAddress: string | null }
  ): Promise<{ tokens: TokenPair }> {
    let payload: { sub: string; email: string; rtid: string; typ: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.cfg.refreshTokenSecret
      });
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token"
      });
    }

    if (payload.typ !== "refresh") {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token type"
      });
    }

    const stored = await this.authRepo.findRefreshTokenById(payload.rtid);
    if (!stored || stored.user_id !== payload.sub || stored.revoked_at !== null) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is revoked or unknown"
      });
    }

    const expiresAt = new Date(stored.expires_at);
    if (expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is expired"
      });
    }

    const presentedHash = this.hashToken(dto.refreshToken);
    if (!this.safeEqual(presentedHash, stored.token_hash)) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token mismatch"
      });
    }

    const nextTokenId = randomUUID();
    const nextTokens = await this.issueTokenPair(
      {
        userId: payload.sub,
        email: payload.email,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress
      },
      nextTokenId
    );

    const rotated = await this.authRepo.revokeRefreshToken({
      tokenId: stored.id,
      replacedByTokenId: nextTokenId
    });
    if (!rotated) {
      await this.authRepo.revokeRefreshToken({ tokenId: nextTokenId });
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token rotation conflict"
      });
    }

    return { tokens: nextTokens };
  }

  async logout(dto: RefreshDto): Promise<{ success: true }> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        rtid: string;
      }>(dto.refreshToken, {
        secret: this.cfg.refreshTokenSecret
      });
      if (payload.rtid) {
        await this.authRepo.revokeRefreshToken({ tokenId: payload.rtid });
      }
    } catch {
      throw new BadRequestException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token"
      });
    }

    return { success: true };
  }

  private async issueTokenPair(
    params: {
      userId: string;
      email: string;
      userAgent: string | null;
      ipAddress: string | null;
    },
    forcedRefreshTokenId?: string
  ): Promise<TokenPair> {
    const refreshTokenId = forcedRefreshTokenId ?? randomUUID();
    const accessPayload = {
      sub: params.userId,
      email: params.email,
      typ: "access"
    };
    const refreshPayload = {
      sub: params.userId,
      email: params.email,
      rtid: refreshTokenId,
      typ: "refresh"
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.cfg.accessTokenSecret,
      expiresIn: this.cfg.accessTokenTtl
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.cfg.refreshTokenSecret,
      expiresIn: `${this.cfg.refreshTokenTtlDays}d`
    });

    await this.authRepo.createRefreshToken({
      id: refreshTokenId,
      userId: params.userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + this.cfg.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
      userAgent: params.userAgent,
      ipAddress: this.normalizeIpAddress(params.ipAddress)
    });

    return {
      accessToken,
      refreshToken
    };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }

  private safeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }
    const maybe = error as { code?: unknown };
    return maybe.code === "23505";
  }

  private normalizeIpAddress(value: string | null): string | null {
    if (!value) {
      return null;
    }
    return isIP(value) > 0 ? value : null;
  }
}
