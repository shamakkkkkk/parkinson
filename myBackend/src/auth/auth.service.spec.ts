import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersServiceMock = { findOneByUsername: jest.fn() };
  const jwtServiceMock = { sign: jest.fn().mockReturnValue('signed-token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('rejects an unknown username', async () => {
    usersServiceMock.findOneByUsername.mockResolvedValue(undefined);

    await expect(
      service.login({ username: 'nobody', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a blocked user even with the right password', async () => {
    usersServiceMock.findOneByUsername.mockResolvedValue({
      id: '1',
      username: 'admin',
      passwordHash: await bcrypt.hash('correct-password', 4),
      roles: ['admin'],
      isBlocked: true,
    });

    await expect(
      service.login({ username: 'admin', password: 'correct-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues a token for valid credentials', async () => {
    usersServiceMock.findOneByUsername.mockResolvedValue({
      id: '1',
      username: 'admin',
      fullName: 'Admin User',
      passwordHash: await bcrypt.hash('correct-password', 4),
      roles: ['admin'],
      isBlocked: false,
    });

    const result = await service.login({
      username: 'admin',
      password: 'correct-password',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(jwtServiceMock.sign).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'admin', roles: ['admin'] }),
    );
  });
});
