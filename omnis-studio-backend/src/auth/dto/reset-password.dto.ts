import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "482913" })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ minLength: 8, example: "newstrongpassword" })
  @IsString()
  @MinLength(8)
  password!: string;
}
