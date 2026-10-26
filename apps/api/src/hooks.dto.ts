import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const responseModes = ['TEXT', 'VOICE', 'QUESTION', 'SHARE'];
const depthLevels = ['LIGHT', 'MEDIUM', 'DEEP'];

export class CreateHookDto {
  @IsString() @MinLength(1) @MaxLength(100) title!: string;
  @IsString() @MinLength(1) @MaxLength(5000) content!: string;
  @IsString() @MinLength(1) @MaxLength(40) category!: string;
  @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(responseModes, { each: true }) preferredResponses!: string[];
  @IsOptional() @IsString() @IsIn(depthLevels) depthLevel?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) excludedResponses?: string[];
}

export class UpdateHookDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(5000) content?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) category?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(responseModes, { each: true }) preferredResponses?: string[];
  @IsOptional() @IsString() @IsIn(depthLevels) depthLevel?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) excludedResponses?: string[];
}
