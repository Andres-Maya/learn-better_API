import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Area } from '../../areas/entities/area.entity';
import { Student } from '../../students/entities/student.entity';

// pg returns numeric columns as strings to avoid losing precision.
const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
};

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  areaId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'areaId' })
  area?: Area;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    transformer: numericTransformer,
  })
  score: number;

  @Column({ type: 'smallint' })
  period: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
