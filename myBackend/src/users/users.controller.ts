import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BlockedGuard } from '../auth/guards/blocked.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Public sign-up endpoint. Always creates a plain "user" account. */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, BlockedGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }
}
