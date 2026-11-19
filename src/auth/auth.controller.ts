import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from '../users/role.enum';
import { PublicUserDto } from '../users/dto/public-user.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './jwt-payload';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /** Inicia sesión y devuelve el token de acceso. */
  // Stricter than the global limit to slow down password guessing.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  /** Datos del usuario que hizo la petición. */
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUserDto> {
    return this.usersService.findOne(user.id);
  }

  /** Crea un usuario ADMIN, TEACHER o STUDENT. */
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<PublicUserDto> {
    return this.usersService.create(dto);
  }
}
