import { IsBoolean, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateHookReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsBoolean()
  wantsPrivateChat!: boolean;
}

export class RespondToHookReplyDto {
  @IsString()
  @IsIn(['ACCEPT', 'DECLINE', 'ACK'])
  decision!: 'ACCEPT' | 'DECLINE' | 'ACK';
}
