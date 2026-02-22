import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { AnswerTrainingQuestionDto } from "./dto/answer-training-question.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";
import { TrainingsService } from "./trainings.service";

@Controller(["trainings", "quiz"])
@UseGuards(JwtAuthGuard)
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Post("sessions")
  async createSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTrainingSessionDto
  ) {
    const result = await this.trainingsService.createSession(user.userId, dto);
    return { data: result };
  }

  @Get("sessions/:sessionId")
  async getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string
  ) {
    const result = await this.trainingsService.getSession(user.userId, sessionId);
    return { data: result };
  }

  @Get("sessions/:sessionId/questions")
  async getQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string,
    @Query("limit") limit?: string
  ) {
    const parsed = limit ? Number(limit) : undefined;
    const result = await this.trainingsService.listQuestions(
      user.userId,
      sessionId,
      Number.isFinite(parsed) ? parsed : 10
    );
    return { data: { items: result } };
  }

  @Get("sessions/:sessionId/next-question")
  async getNextQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string
  ) {
    const result = await this.trainingsService.listQuestions(user.userId, sessionId, 1);
    return { data: { item: result[0] ?? null } };
  }

  @Post("sessions/:sessionId/answers")
  async answer(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string,
    @Body() dto: AnswerTrainingQuestionDto
  ) {
    const result = await this.trainingsService.submitAnswer(user.userId, sessionId, dto);
    return { data: result };
  }

  @Post("sessions/:sessionId/complete")
  async complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string
  ) {
    const result = await this.trainingsService.completeSession(user.userId, sessionId);
    return { data: result };
  }
}
