import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MinLength } from "class-validator";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export class SendVerificationCodeDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: "StrongPass1!" })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, {
    message:
      "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character.",
  })
  password!: string;
}
