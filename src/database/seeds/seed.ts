import { hash } from 'bcryptjs';
import { EntityManager } from 'typeorm';
import { Area } from '../../areas/entities/area.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import dataSource from '../data-source';
import { SEED_AREAS, SEED_STUDENTS, SEED_USERS } from './seed-data';

// Loads demo data. Safe to run several times: existing rows are kept, not duplicated.
async function seed(manager: EntityManager): Promise<void> {
  const areas = new Map<string, Area>();
  for (const data of SEED_AREAS) {
    const area =
      (await manager.findOneBy(Area, { name: data.name })) ??
      (await manager.save(manager.create(Area, data)));
    areas.set(area.name, area);
  }
  console.log(`Materias: ${areas.size}`);

  let newGrades = 0;
  const students = new Map<string, Student>();
  for (const { scores, ...data } of SEED_STUDENTS) {
    const existing = await manager.findOneBy(Student, { email: data.email });
    if (existing) {
      students.set(data.email, existing);
      continue;
    }

    const student = await manager.save(manager.create(Student, data));
    students.set(data.email, student);
    for (const [areaName, periodScores] of Object.entries(scores)) {
      const area = areas.get(areaName)!;
      const grades = (periodScores ?? []).map((score, index) =>
        manager.create(Grade, {
          studentId: student.id,
          areaId: area.id,
          score,
          period: index + 1,
          description: `Evaluación del periodo ${index + 1}`,
        }),
      );
      await manager.save(grades);
      newGrades += grades.length;
    }
  }
  console.log(`Estudiantes: ${students.size} (notas nuevas: ${newGrades})`);

  for (const { studentEmail, password, ...data } of SEED_USERS) {
    if (await manager.existsBy(User, { email: data.email })) {
      continue;
    }
    await manager.save(
      manager.create(User, {
        ...data,
        passwordHash: await hash(password, 10),
        studentId: studentEmail ? students.get(studentEmail)!.id : null,
      }),
    );
    console.log(`Usuario creado: ${data.email} / ${password}`);
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await dataSource.transaction(seed);
    console.log('Datos de ejemplo listos.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('No se pudieron cargar los datos de ejemplo:', error);
  process.exitCode = 1;
});
