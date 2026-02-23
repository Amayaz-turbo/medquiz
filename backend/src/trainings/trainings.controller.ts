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
import { CreateQuestionSubmissionDto } from "./dto/create-question-submission.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";
import { ReviewQuestionSubmissionDto } from "./dto/review-question-submission.dto";
import { SetChapterProgressDto } from "./dto/set-chapter-progress.dto";
import { UpsertTrainingQuestionDto } from "./dto/upsert-training-question.dto";
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

  @Post("submissions")
  async createQuestionSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuestionSubmissionDto
  ) {
    const result = await this.trainingsService.createQuestionSubmission(user.userId, dto);
    return { data: result };
  }

  @Get("submissions")
  async listQuestionSubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: string,
    @Query("createdBy") createdBy?: string,
    @Query("questionType") questionType?: string,
    @Query("subjectId") subjectId?: string,
    @Query("chapterId") chapterId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    const result = await this.trainingsService.listQuestionSubmissions(user.userId, {
      status,
      createdBy,
      questionType,
      subjectId,
      chapterId,
      limit,
      offset
    });
    return { data: result };
  }

  @Get("admin/submissions/review-queue")
  async listSubmissionReviewQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit") limit?: string
  ) {
    const result = await this.trainingsService.listSubmissionReviewQueue(user.userId, { limit });
    return { data: result };
  }

  @Get("admin/submissions/dashboard")
  async getSubmissionReviewDashboard(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.trainingsService.getSubmissionReviewDashboard(user.userId);
    return { data: result };
  }

  @Get("submissions/:submissionId")
  async getQuestionSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param("submissionId", new ParseUUIDPipe({ version: "4" })) submissionId: string
  ) {
    const result = await this.trainingsService.getQuestionSubmission(user.userId, submissionId);
    return { data: result };
  }

  @Post("admin/questions")
  async createAdminQuestion(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertTrainingQuestionDto) {
    const result = await this.trainingsService.createAdminQuestion(user.userId, dto);
    return { data: result };
  }

  @Get("admin/questions/:questionId")
  async getAdminQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string
  ) {
    const result = await this.trainingsService.getAdminQuestion(user.userId, questionId);
    return { data: result };
  }

  @Get("admin/questions")
  async listAdminQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: string,
    @Query("questionType") questionType?: string,
    @Query("subjectId") subjectId?: string,
    @Query("chapterId") chapterId?: string,
    @Query("createdBy") createdBy?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    const result = await this.trainingsService.listAdminQuestions(user.userId, {
      status,
      questionType,
      subjectId,
      chapterId,
      createdBy,
      limit,
      offset
    });
    return { data: result };
  }

  @Put("admin/questions/:questionId")
  async updateAdminQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string,
    @Body() dto: UpsertTrainingQuestionDto
  ) {
    const result = await this.trainingsService.updateAdminQuestion(user.userId, questionId, dto);
    return { data: result };
  }

  @Post("admin/questions/:questionId/publish")
  async publishAdminQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string
  ) {
    const result = await this.trainingsService.publishAdminQuestion(user.userId, questionId);
    return { data: result };
  }

  @Post("admin/questions/:questionId/retire")
  async retireAdminQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", new ParseUUIDPipe({ version: "4" })) questionId: string
  ) {
    const result = await this.trainingsService.retireAdminQuestion(user.userId, questionId);
    return { data: result };
  }

  @Post("admin/submissions/:submissionId/review")
  async reviewQuestionSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param("submissionId", new ParseUUIDPipe({ version: "4" })) submissionId: string,
    @Body() dto: ReviewQuestionSubmissionDto
  ) {
    const result = await this.trainingsService.reviewQuestionSubmission(user.userId, submissionId, dto);
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
