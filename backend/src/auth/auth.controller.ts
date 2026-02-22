import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "./interfaces/authenticated-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: FastifyRequest) {
    const result = await this.authService.register(dto, {
      userAgent: this.headerToString(req.headers["user-agent"]),
      ipAddress: req.ip ?? null
    });
    return { data: result };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    const result = await this.authService.login(dto, {
      userAgent: this.headerToString(req.headers["user-agent"]),
      ipAddress: req.ip ?? null
    });
    return { data: result };
  }

  @Post("refresh")
  async refresh(@Body() dto: RefreshDto, @Req() req: FastifyRequest) {
    const result = await this.authService.refresh(dto, {
      userAgent: this.headerToString(req.headers["user-agent"]),
      ipAddress: req.ip ?? null
    });
    return { data: result };
  }

  @Post("logout")
  async logout(@Body() dto: RefreshDto) {
    const result = await this.authService.logout(dto);
    return { data: result };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: {
        id: user.userId,
        email: user.email
      }
    };
  }

  private headerToString(value: string | string[] | undefined): string | null {
    if (typeof value === "string") {
      return value;
    }
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
    return null;
  }
}
