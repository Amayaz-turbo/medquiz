import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { DEMO_PAGE_HTML } from "./demo.page";
import { DemoService } from "./demo.service";
import { createReadStream, existsSync } from "node:fs";
import { basename, join } from "node:path";

@Controller("demo")
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get("assets/:filename")
  serveDemoAsset(@Param("filename") filename: string): StreamableFile {
    const safeFilename = basename(filename);
    const fullPath = join(process.cwd(), "assets", safeFilename);

    if (!existsSync(fullPath)) {
      throw new NotFoundException("Demo asset not found");
    }

    const type = safeFilename.toLowerCase().endsWith(".png")
      ? "image/png"
      : safeFilename.toLowerCase().endsWith(".jpg") || safeFilename.toLowerCase().endsWith(".jpeg")
        ? "image/jpeg"
        : "application/octet-stream";

    return new StreamableFile(createReadStream(fullPath), {
      type
    });
  }

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
