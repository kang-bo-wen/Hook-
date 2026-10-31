import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const responseModes = ['TEXT', 'VOICE', 'QUESTION', 'SHARE'];
const depthLevels = ['LIGHT', 'MEDIUM', 'DEEP'];

export class UpdateReceiverPreferenceDto {
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(12) @IsString({ each: true }) topicTypes!: string[];
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(responseModes, { each: true }) responseModes!: string[];
  @IsOptional() @IsString() @IsIn(depthLevels) depthLevel?: string;
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) excludedTypes!: string[];
  @IsOptional() @IsString() @MaxLength(1000) naturalLanguage?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) expectedGrades?: string[];
  @IsOptional() @IsInt() @Min(120) @Max(230) minHeightCm?: number;
  @IsOptional() @IsInt() @Min(120) @Max(230) maxHeightCm?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @IsIn(['POSTGRAD', 'ABROAD', 'WORK', 'PUBLIC_SECTOR', 'UNSURE'], { each: true }) expectedFuturePlans?: string[];
  @IsNumber() @Min(-1) @Max(1) campusPreference!: number;
  @IsNumber() @Min(-1) @Max(1) departmentAvoidance!: number;
  @IsNumber() @Min(-1) @Max(1) personalitySimilarity!: number;
  @IsOptional() @IsString() @IsIn(['SLOW', 'BALANCED', 'DIRECT']) relationshipPace?: string;
  @IsOptional() @IsString() @IsIn(['COOL_DOWN', 'TALK_NOW', 'WRITE_FIRST']) conflictStyle?: string;
  @IsOptional() @IsString() @IsIn(['COMFORT', 'THINK', 'FUN', 'ACTIVITY']) currentMood?: string;
  @IsOptional() @IsString() @IsIn(['LONGFORM', 'CONCISE', 'HUMOR']) writingStyle?: string;
  @IsInt() @Min(1) @Max(2) dailyReceiveLimit!: number;
  @IsNumber() @Min(-1) @Max(1) strictness!: number;
}
