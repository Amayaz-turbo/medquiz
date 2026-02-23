import { IsString, MaxLength } from "class-validator";

export class AddOpenTextAcceptedAnswerDto {
  @IsString()
  @MaxLength(300)
  acceptedAnswerText!: string;
}
