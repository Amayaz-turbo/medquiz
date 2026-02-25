import { Controller, Get, Header } from "@nestjs/common";
import { DEMO_PAGE_HTML } from "./demo.page";

@Controller("demo")
export class DemoController {
  @Get()
  @Header("content-type", "text/html; charset=utf-8")
  renderDemo(): string {
    return DEMO_PAGE_HTML;
  }
}
