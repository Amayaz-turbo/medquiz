import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "../config/env";
import { AuthenticatedUser } from "./interfaces/authenticated-user.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const cfg = env();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.accessTokenSecret
    });
  }

  validate(payload: unknown): AuthenticatedUser {
    if (!payload || typeof payload !== "object") {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid access token payload"
      });
    }
    const candidate = payload as Record<string, unknown>;
    const sub = candidate["sub"];
    const email = candidate["email"];
    const typ = candidate["typ"];

    if (typ !== "access" || typeof sub !== "string" || typeof email !== "string") {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid access token claims"
      });
    }

    return {
      userId: sub,
      email
    };
  }
}
