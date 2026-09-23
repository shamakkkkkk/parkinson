import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateUserDto } from './dto/create-user.dto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  roles: string[];
  isBlocked: boolean;
  fullName: string;
  emailAddress: string;
  createdAt: string;
  modifiedAt?: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

const SALT_ROUNDS = 10;

/**
 * Persists users to a JSON file on disk.
 *
 * NOTE for production: a flat file is fine for coursework/local dev, but it
 * does not handle concurrent writes safely and won't scale. Before a real
 * deployment this should be swapped for a proper database (e.g. Postgres);
 * the public `create` / `findOneByUsername` / `remove` interface below is
 * deliberately kept small so that swap only touches this one file.
 */
@Injectable()
export class UsersService {
  private readonly filePath = path.resolve(process.cwd(), 'users.json');
  // Serializes writes so two concurrent signups can't clobber each other.
  private writeQueue: Promise<unknown> = Promise.resolve();

  private async readFromFile(): Promise<User[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as User[];
    } catch {
      return [];
    }
  }

  private async writeToFile(users: User[]): Promise<void> {
    await fs.writeFile(
      this.filePath,
      JSON.stringify(users, null, 2),
      'utf-8',
    );
  }

  private withWriteLock<T>(task: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(task, task);
    this.writeQueue = result.catch(() => undefined);
    return result;
  }

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    return this.withWriteLock(async () => {
      const users = await this.readFromFile();

      if (users.some((user) => user.username === createUserDto.username)) {
        throw new BadRequestException('Username is already taken');
      }

      const passwordHash = await bcrypt.hash(
        createUserDto.password,
        SALT_ROUNDS,
      );

      const newUser: User = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        emailAddress: createUserDto.emailAddress,
        passwordHash,
        roles: ['user'], // never trust a client-supplied role on signup
        isBlocked: false,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      await this.writeToFile(users);

      const { passwordHash: _omit, ...publicUser } = newUser;
      return publicUser;
    });
  }

  async findOneByUsername(username: string): Promise<User | undefined> {
    const users = await this.readFromFile();
    return users.find((user) => user.username === username);
  }

  async remove(id: string): Promise<void> {
    await this.withWriteLock(async () => {
      const users = await this.readFromFile();
      const index = users.findIndex((user) => user.id === id);

      if (index === -1) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      users.splice(index, 1);
      await this.writeToFile(users);
    });
  }
}
