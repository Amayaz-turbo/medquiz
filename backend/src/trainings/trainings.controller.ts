import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface";
import { AnswerTrainingQuestionDto } from "./dto/answer-training-question.dto";
import { AddOpenTextAcceptedAnswerDto } from "./dto/add-open-text-accepted-answer.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";
import { SetChapterProgressDto } from "./dto/set-chapter-progress.dto";
import { TrainingsService } from "./trainings.service";

@Controller(["trainings", "quiz"])
@UseGuards(JwtAuthGuard)
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get("dashboard")
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.trainingsService.getDashboard(user.userId);
    return { data: result };
  }

  @Get("state/subjects")
  async getSubjectStates(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.trainingsService.listSubjectStates(user.userId);
    return { data: { items: result } };
  }

  @Get("state/subjects/:subjectId/chapters")
  async getSubjectChapterStates(
    @CurrentUser() user: AuthenticatedUser,
    @Param("subjectId") subjectId: string
  ) {
    const result = await this.trainingsService.listSubjectChapterStates(user.userId, subjectId);
    return { data: result };
  }

  @Put("state/chapters/:chapterId")
  async setChapterProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("chapterId") chapterId: string,
    @Body() dto: SetChapterProgressDto
  ) {
    const result = await this.trainingsService.setChapterProgress(
      user.userId,
      chapterId,
      dto.declaredProgressPct
    );
    return { data: result };
  }

  @Get("admin/open-text/questions/:questionId/accepted-answers")
  async listOpenTextAcceptedAnswers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string
  ) {
    const result = await this.trainingsService.listOpenTextAcceptedAnswers(user.userId, questionId);
    return { data: { items: result } };
  }

  @Post("admin/open-text/questions/:questionId/accepted-answers")
  async addOpenTextAcceptedAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string,
    @Body() dto: AddOpenTextAcceptedAnswerDto
  ) {
    const result = await this.trainingsService.addOpenTextAcceptedAnswer(
      user.userId,
      questionId,
      dto.acceptedAnswerText
    );
    return { data: result };
  }

  @Delete("admin/open-text/questions/:questionId/accepted-answers/:answerId")
  async deleteOpenTextAcceptedAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string,
    @Param("answerId", new ParseUUIDPipe({ version: "4" })) answerId: string
  ) {
    const result = await this.trainingsService.deleteOpenTextAcceptedAnswer(
      user.userId,
      questionId,
      answerId
    );
    return { data: result };
  }

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
