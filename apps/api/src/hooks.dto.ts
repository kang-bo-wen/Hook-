import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const responseModes = ['TEXT', 'VOICE', 'QUESTION', 'SHARE'];
const depthLevels = ['LIGHT', 'MEDIUM', 'DEEP'];
const moodTags = ['COMFORT', 'THINK', 'FUN', 'ACTIVITY', 'CURIOUS', 'LONELY', 'EXCITED', 'CALM'];

export class CreateHookDto {
  @IsString() @MinLength(1) @MaxLength(100) title!: string;
  @IsString() @MinLength(1) @MaxLength(5000) content!: string;
  @IsString() @MinLength(1) @MaxLength(40) category!: string;
  @IsArray() @ArrayMaxSize(4) @IsString({ each: true }) @IsIn(moodTags, { each: true }) moodTags!: string[];
  @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(responseModes, { each: true }) preferredResponses!: string[];
  @IsOptional() @IsString() @IsIn(depthLevels) depthLevel?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) excludedResponses?: string[];
  @IsBoolean() allowPrivateChatRequest!: boolean;
  @IsBoolean() revealNickname!: boolean;
  @IsBoolean() revealProfileTags!: boolean;
  @IsOptional() @IsBoolean() saveAsDraft?: boolean;
}

export class UpdateHookDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(5000) content?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) category?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(4) @IsString({ each: true }) @IsIn(moodTags, { each: true }) moodTags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(responseModes, { each: true }) preferredResponses?: string[];
  @IsOptional() @IsString() @IsIn(depthLevels) depthLevel?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) excludedResponses?: string[];
  @IsOptional() @IsBoolean() allowPrivateChatRequest?: boolean;
  @IsOptional() @IsBoolean() revealNickname?: boolean;
  @IsOptional() @IsBoolean() revealProfileTags?: boolean;
}
