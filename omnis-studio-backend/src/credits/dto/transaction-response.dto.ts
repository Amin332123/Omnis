import { ApiProperty } from "@nestjs/swagger"

export class TransactionResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  amount!: number

  @ApiProperty()
  currency!: string

  @ApiProperty()
  creditsPurchased!: number

  @ApiProperty()
  creditsBefore!: number

  @ApiProperty()
  creditsAfter!: number

  @ApiProperty()
  status!: string

  @ApiProperty()
  createdAt!: string
}
