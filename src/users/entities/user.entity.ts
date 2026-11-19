import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Role } from '../role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // Never returned by the API: services strip it with toPublicUser().
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, enumName: 'users_role_enum' })
  role: Role;

  // Only STUDENT users are linked to a student, so they can see their own grades.
  // The one-to-one relation already makes the column unique.
  @Column({ type: 'uuid', nullable: true })
  studentId: string | null;

  @OneToOne(() => Student, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
