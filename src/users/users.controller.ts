import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './role.enum';
import { UsersService } from './users.service';

// Users are created with POST /auth/register; this controller manages them afterwards.
@ApiTags('Usuarios')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Lista los usuarios. */
  @Get()
  findAll(): Promise<PublicUserDto[]> {
    return this.usersService.findAll();
  }

  /** Muestra un usuario. */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PublicUserDto> {
    return this.usersService.findOne(id);
  }

  /** Edita el correo, la contraseña, el rol o el estudiante enlazado. */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUserDto> {
    return this.usersService.update(id, dto);
  }

  /** Borra un usuario. No se puede borrar el propio ni el único administrador. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.usersService.remove(id, user.id);
  }
}
