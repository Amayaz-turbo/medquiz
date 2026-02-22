import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { DatabaseService } from "../database/database.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profileResult = await this.db.query<{
      id: string;
      email: string;
      display_name: string;
      study_track: string | null;
      year_label: string | null;
    }>(
      `
        SELECT
          u.id,
          u.email,
          u.display_name,
          up.study_track,
          up.year_label
        FROM users u
        LEFT JOIN user_profiles up
          ON up.user_id = u.id
        WHERE u.id = $1
        LIMIT 1
      `,
      [user.userId]
    );

    const me = profileResult.rows[0];
    return {
      data: {
        id: me?.id ?? user.userId,
        email: me?.email ?? user.email,
        displayName: me?.display_name ?? "",
        studyTrack: me?.study_track ?? null,
        yearLabel: me?.year_label ?? null
      }
    };
  }
}
