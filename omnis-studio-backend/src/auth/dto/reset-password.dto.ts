import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, Matches, MinLength } from "class-validator";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export class ResetPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "482913" })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ minLength: 8, example: "NewStrongPass1!" })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, {
    message:
      "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character.",
  })
  password!: string;
}
