import { Paginated } from '../../common/dto/paginated.dto';
import { Grade } from '../entities/grade.entity';

export class PaginatedGradesDto extends Paginated(Grade) {}
