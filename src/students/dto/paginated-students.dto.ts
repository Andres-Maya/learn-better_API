import { Paginated } from '../../common/dto/paginated.dto';
import { Student } from '../entities/student.entity';

export class PaginatedStudentsDto extends Paginated(Student) {}
