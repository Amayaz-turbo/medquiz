import { Controller, Get, Header, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { DEMO_PAGE_HTML } from "./demo.page";
import { DemoService } from "./demo.service";

@Controller("demo")
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get()
  @Header("content-type", "text/html; charset=utf-8")
  renderDemo(): string {
    return DEMO_PAGE_HTML;
  }

  @Post("bootstrap-data")
  @UseGuards(JwtAuthGuard)
  async bootstrapData(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.demoService.ensureDemoCatalog(user.userId);
    return { data: result };
  }
}
