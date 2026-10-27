import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
