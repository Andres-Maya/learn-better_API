import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { Area } from './models/area.model';

@Injectable()
export class AreasService {
  private readonly areas = new Map<string, Area>();

  async create(dto: CreateAreaDto): Promise<Area> {
    await this.assertNameIsAvailable(dto.name);
    const area: Area = {
      id: randomUUID(),
      ...dto,
      createdAt: new Date(),
    };
    this.areas.set(area.id, area);
    return area;
  }

  async findAll(): Promise<Area[]> {
    return [...this.areas.values()];
  }

  async findOne(id: string): Promise<Area> {
    const area = this.areas.get(id);
    if (!area) {
      throw new NotFoundException(`Area with id "${id}" not found`);
    }
    return area;
  }

  async update(id: string, dto: UpdateAreaDto): Promise<Area> {
    const area = await this.findOne(id);
    if (dto.name !== undefined) {
      await this.assertNameIsAvailable(dto.name, id);
    }
    return Object.assign(area, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    this.areas.delete(id);
  }

  private async assertNameIsAvailable(
    name: string,
    ignoreId?: string,
  ): Promise<void> {
    const normalized = name.trim().toLowerCase();
    const taken = (await this.findAll()).some(
      (area) =>
        area.id !== ignoreId && area.name.trim().toLowerCase() === normalized,
    );
    if (taken) {
      throw new ConflictException(`Area "${name}" already exists`);
    }
  }
}
