import * as fs from 'fs/promises';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

jest.mock('fs/promises');

describe('UsersService', () => {
  let service: UsersService;
  const readFile = fs.readFile as jest.Mock;
  const writeFile = fs.writeFile as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    readFile.mockResolvedValue('[]');
    writeFile.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a user with the default "user" role, ignoring any client-supplied role', async () => {
    const created = await service.create({
      username: 'alice',
      password: 'super-secret-1',
      fullName: 'Alice Example',
      emailAddress: 'alice@example.com',
      // @ts-expect-error - CreateUserDto has no `roles` field on purpose
      roles: ['admin'],
    });

    expect(created.roles).toEqual(['user']);
    expect(created).not.toHaveProperty('passwordHash');
    expect(writeFile).toHaveBeenCalled();
  });

  it('rejects a duplicate username', async () => {
    readFile.mockResolvedValue(
      JSON.stringify([
        {
          id: '1',
          username: 'alice',
          passwordHash: 'x',
          roles: ['user'],
          isBlocked: false,
          fullName: 'Alice',
          emailAddress: 'alice@example.com',
          createdAt: new Date().toISOString(),
        },
      ]),
    );

    await expect(
      service.create({
        username: 'alice',
        password: 'super-secret-1',
        fullName: 'Alice Again',
        emailAddress: 'alice2@example.com',
      }),
    ).rejects.toThrow('Username is already taken');
  });
});
