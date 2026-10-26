import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(40) nickname?: string;
  @IsOptional() @IsString() @MaxLength(100) school?: string;
  @IsOptional() @IsString() @MaxLength(40) grade?: string;
  @IsOptional() @IsString() @MaxLength(40) city?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) interests?: string[];
  @IsOptional() @IsString() @MaxLength(100) relationshipGoal?: string;
}
