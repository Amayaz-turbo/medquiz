import { IsUUID } from "class-validator";

export class ChooseSubjectDto {
  @IsUUID("4")
  subjectId!: string;
}
