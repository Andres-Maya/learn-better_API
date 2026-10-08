import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/is-unique-violation';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { Area } from './entities/area.entity';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areasRepository: Repository<Area>,
  ) {}

  async create(dto: CreateAreaDto): Promise<Area> {
    await this.assertNameIsAvailable(dto.name);
    return this.save(this.areasRepository.create(dto));
  }

  findAll(): Promise<Area[]> {
    return this.areasRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Area> {
    const area = await this.areasRepository.findOneBy({ id });
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
    return this.save(Object.assign(area, dto));
  }

  async remove(id: string): Promise<void> {
    const area = await this.findOne(id);
    await this.areasRepository.remove(area);
  }

  private async assertNameIsAvailable(
    name: string,
    ignoreId?: string,
  ): Promise<void> {
    const existing = await this.areasRepository
      .createQueryBuilder('area')
      .where('LOWER(TRIM(area.name)) = :name', {
        name: name.trim().toLowerCase(),
      })
      .getOne();
    if (existing && existing.id !== ignoreId) {
      throw this.nameTaken(name);
    }
  }

  // The unique constraint still catches two requests racing past the check above.
  private async save(area: Area): Promise<Area> {
    try {
      return await this.areasRepository.save(area);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw this.nameTaken(area.name);
      }
      throw error;
    }
  }

  private nameTaken(name: string): ConflictException {
    return new ConflictException(`Area "${name}" already exists`);
  }
}
