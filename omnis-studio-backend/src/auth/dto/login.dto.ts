import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "test@test.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "12345678",
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
