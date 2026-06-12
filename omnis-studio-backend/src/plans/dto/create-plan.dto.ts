import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePlanDto {
  @ApiProperty({ example: "Starter Pack" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 300 })
  @IsInt()
  @Min(1)
  credits!: number;

  @ApiProperty({ example: 29 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: "pro_01kty756pz1wm7zg07c6spvsw5" })
  @IsOptional()
  @IsString()
  paddlePriceId?: string;

  @ApiPropertyOptional({ example: ["Credits to use anytime", "Credits never expire", "Generate images & videos"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 1, description: "Sort order for display (lower = first)" })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
