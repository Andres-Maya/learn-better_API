import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/env.validation';
import { Role } from './role.enum';
import { UsersService } from './users.service';

// Without a first admin nobody could log in to create the other users.
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (await this.usersService.existsWithRole(Role.ADMIN)) {
      return;
    }

    const email = this.config.get('ADMIN_EMAIL', { infer: true });
    await this.usersService.create({
      email,
      password: this.config.get('ADMIN_PASSWORD', { infer: true }),
      role: Role.ADMIN,
    });
    this.logger.log(`Administrador inicial creado: ${email}`);
  }
}
