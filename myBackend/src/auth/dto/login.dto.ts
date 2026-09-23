import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  // Renamed from the confusing `passwordHash` (the client sends the *plain*
  // password here; the server is the only place that hashes/compares it).
  @IsString()
  @MinLength(1)
  password!: string;
}
