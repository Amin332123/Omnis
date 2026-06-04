import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

export class UpdateUserPasswordDto {
  @ApiProperty({
    minLength: 8,
    example: "StrongPassword#123",
    description: "New password for the user (min 8 characters).",
  })
  @IsString()
  @MinLength(8)
  password!: string
}
