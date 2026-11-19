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
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { Area } from './entities/area.entity';

@Roles(Role.ADMIN, Role.TEACHER)
@ApiTags('Materias')
@ApiBearerAuth()
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  /** Crea una materia. */
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateAreaDto): Promise<Area> {
    return this.areasService.create(dto);
  }

  /** Lista las materias. */
  @Get()
  findAll(): Promise<Area[]> {
    return this.areasService.findAll();
  }

  /** Muestra una materia. */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Area> {
    return this.areasService.findOne(id);
  }

  /** Edita una materia. */
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaDto,
  ): Promise<Area> {
    return this.areasService.update(id, dto);
  }

  /** Borra una materia y todas sus notas. */
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.areasService.remove(id);
  }
}
