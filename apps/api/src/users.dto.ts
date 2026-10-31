import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const communicationStyles = ['LISTENER', 'BALANCED', 'EXPRESSIVE'];
const availableTimes = ['WEEKDAY_DAY', 'WEEKDAY_NIGHT', 'WEEKEND'];

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(40) nickname?: string;
  @IsOptional() @IsString() @MaxLength(100) school?: string;
  @IsOptional() @IsString() @MaxLength(40) grade?: string;
  @IsOptional() @IsString() @MaxLength(40) city?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) interests?: string[];
  @IsOptional() @IsString() @MaxLength(100) relationshipGoal?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) personalityTags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) @IsIn(availableTimes, { each: true }) availableTimes?: string[];
  @IsOptional() @IsString() @IsIn(communicationStyles) communicationStyle?: string;
  @IsOptional() @IsString() @MaxLength(100) faculty?: string;
  @IsOptional() @IsString() @MaxLength(100) major?: string;
  @IsOptional() @IsString() @IsIn(['MINHANG', 'XUHUI', 'OTHER']) campus?: string;
  @IsOptional() @IsInt() @Min(1980) @Max(2020) birthYear?: number;
  @IsOptional() @IsInt() @Min(120) @Max(230) heightCm?: number;
  @IsOptional() @IsString() @IsIn(['SLIM', 'AVERAGE', 'ATHLETIC', 'CURVY', 'OTHER']) bodyType?: string;
  @IsOptional() @IsString() @MaxLength(4) mbti?: string;
  @IsOptional() @IsString() @IsIn(['POSTGRAD', 'ABROAD', 'WORK', 'PUBLIC_SECTOR', 'UNSURE']) futurePlan?: string;
  @IsOptional() @IsString() @IsIn(['SLOW', 'BALANCED', 'DIRECT']) relationshipPace?: string;
  @IsOptional() @IsString() @IsIn(['COOL_DOWN', 'TALK_NOW', 'WRITE_FIRST']) conflictStyle?: string;
}
