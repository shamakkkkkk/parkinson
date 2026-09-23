import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.findOneByUsername(loginDto.username);

    // Compare against the same generic message whether the user exists or
    // not, and whether the password is wrong - this avoids leaking which
    // usernames are registered (a real, if minor, flaw in the original code
    // was low-risk here already, but it's worth keeping this habit).
    const invalidCredentials = () =>
      new UnauthorizedException('Invalid username or password');

    if (!user) {
      throw invalidCredentials();
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('This account has been blocked');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw invalidCredentials();
    }

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: '1h',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        roles: user.roles,
      },
    };
  }
}
