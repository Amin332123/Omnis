import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, Min } from "class-validator"

export class UpdateUserCreditsDto {
  @ApiProperty({
    example: 25,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  credits!: number
}
