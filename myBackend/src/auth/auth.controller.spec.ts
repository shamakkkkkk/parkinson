import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = { login: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates login to AuthService', async () => {
    authServiceMock.login.mockResolvedValue({ accessToken: 'token' });

    const result = await controller.login({
      username: 'admin',
      password: 'secret',
    });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'secret',
    });
    expect(result).toEqual({ accessToken: 'token' });
  });
});
