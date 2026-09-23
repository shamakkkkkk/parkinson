import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username!: string;

  // Renamed from `passwordHash` - the client sends the plain password; only
  // the server ever hashes it. `roles` is intentionally NOT part of this DTO:
  // the previous version let any anonymous caller POST /users with
  // roles: ["admin"] and self-promote to administrator. New users are always
  // created with the default "user" role (see UsersService.create).
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsEmail()
  emailAddress!: string;
}
