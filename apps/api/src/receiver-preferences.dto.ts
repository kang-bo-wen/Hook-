import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const responseModes = ['TEXT', 'VOICE', 'QUESTION', 'SHARE'];
const depthLevels = ['LIGHT', 'MEDIUM', 'DEEP'];

export class UpdateReceiverPreferenceDto {
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(12) @IsString({ each: true }) topicTypes!: string[];
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(responseModes, { each: true }) responseModes!: string[];
  @IsOptional() @IsString() @IsIn(depthLevels) depthLevel?: string;
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) excludedTypes!: string[];
  @IsOptional() @IsString() @MaxLength(1000) naturalLanguage?: string;
}
