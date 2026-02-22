import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { AnswerOpenerDto } from "./dto/answer-opener.dto";
import { ChooseSubjectDto } from "./dto/choose-subject.dto";
import { CreateDuelDto } from "./dto/create-duel.dto";
import { DuelRoundAnswerDto } from "./dto/duel-round-answer.dto";
import { JokerRequestDto } from "./dto/joker-request.dto";
import { JokerRespondDto } from "./dto/joker-respond.dto";
import { OpenerDecisionDto } from "./dto/opener-decision.dto";
import { DuelsService } from "./duels.service";

@Controller("duels")
@UseGuards(JwtAuthGuard)
export class DuelsController {
  constructor(private readonly duelsService: DuelsService) {}

  @Post()
  async createDuel(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDuelDto
  ) {
    const result = await this.duelsService.createDuel(user.userId, dto);
    return { data: result };
  }

  @Get()
  async listDuels(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: "pending_opener" | "in_progress" | "completed" | "cancelled" | "expired"
  ) {
    const result = await this.duelsService.listDuels(user.userId, status);
    return { data: { items: result } };
  }

  @Get(":duelId")
  async getDuel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string
  ) {
    const result = await this.duelsService.getDuel(user.userId, duelId);
    return { data: result };
  }

  @Post(":duelId/accept")
  async acceptDuel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string
  ) {
    const result = await this.duelsService.acceptDuel(user.userId, duelId);
    return { data: result };
  }

  @Post(":duelId/decline")
  async declineDuel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string
  ) {
    const result = await this.duelsService.declineDuel(user.userId, duelId);
    return { data: result };
  }

  @Get(":duelId/opener")
  async getOpener(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string
  ) {
    const result = await this.duelsService.getOpener(user.userId, duelId);
    return { data: result };
  }

  @Post(":duelId/opener/answer")
  async answerOpener(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Body() dto: AnswerOpenerDto
  ) {
    const result = await this.duelsService.answerOpener(user.userId, duelId, dto);
    return { data: result };
  }

  @Post(":duelId/opener/decision")
  async decideOpener(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Body() dto: OpenerDecisionDto
  ) {
    const result = await this.duelsService.decideOpener(user.userId, duelId, dto);
    return { data: result };
  }

  @Get(":duelId/rounds/current")
  async getCurrentRound(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string
  ) {
    const result = await this.duelsService.getCurrentRound(user.userId, duelId);
    return { data: result };
  }

  @Post(":duelId/rounds/:roundNo/choose-subject")
  async chooseRoundSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Param("roundNo") roundNoRaw: string,
    @Body() dto: ChooseSubjectDto
  ) {
    const result = await this.duelsService.chooseRoundSubject(
      user.userId,
      duelId,
      Number(roundNoRaw),
      dto
    );
    return { data: result };
  }

  @Get(":duelId/rounds/:roundNo/questions")
  async getRoundQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Param("roundNo") roundNoRaw: string
  ) {
    const result = await this.duelsService.getRoundQuestions(
      user.userId,
      duelId,
      Number(roundNoRaw)
    );
    return { data: { items: result } };
  }

  @Post(":duelId/rounds/:roundNo/answers")
  async submitRoundAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Param("roundNo") roundNoRaw: string,
    @Body() dto: DuelRoundAnswerDto
  ) {
    const result = await this.duelsService.submitRoundAnswer(
      user.userId,
      duelId,
      Number(roundNoRaw),
      dto
    );
    return { data: result };
  }

  @Post(":duelId/jokers/request")
  async requestJoker(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Body() dto: JokerRequestDto
  ) {
    const result = await this.duelsService.requestJoker(user.userId, duelId, dto);
    return { data: result };
  }

  @Post(":duelId/jokers/:jokerId/respond")
  async respondJoker(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string,
    @Param("jokerId") jokerId: string,
    @Body() dto: JokerRespondDto
  ) {
    const result = await this.duelsService.respondJoker(user.userId, duelId, jokerId, dto);
    return { data: result };
  }

  @Post(":duelId/forfeit")
  async forfeitDuel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("duelId") duelId: string
  ) {
    const result = await this.duelsService.forfeitDuel(user.userId, duelId);
    return { data: result };
  }
}
