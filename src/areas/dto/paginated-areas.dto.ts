import { Paginated } from '../../common/dto/paginated.dto';
import { Area } from '../entities/area.entity';

export class PaginatedAreasDto extends Paginated(Area) {}
