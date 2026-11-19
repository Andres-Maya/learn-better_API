import { Role } from '../../users/role.enum';

export const SEED_AREAS = [
  { name: 'Matemáticas', description: 'Álgebra, geometría y estadística' },
  {
    name: 'Lenguaje',
    description: 'Comprensión lectora y producción de textos',
  },
  { name: 'Inglés', description: 'Lectura, escritura y conversación' },
  { name: 'Ciencias Naturales', description: 'Biología, química y física' },
  {
    name: 'Ciencias Sociales',
    description: 'Historia, geografía y democracia',
  },
];

type AreaName = (typeof SEED_AREAS)[number]['name'];

// Scores per area, one per period (1 to 4). Each student shows a different profile.
interface SeedStudent {
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string;
  scores: Partial<Record<AreaName, number[]>>;
}

export const SEED_STUDENTS: SeedStudent[] = [
  {
    // Low in math but improving, strong in English.
    firstName: 'Laura',
    lastName: 'Gómez',
    email: 'laura.gomez@colegio.edu.co',
    gradeLevel: '9A',
    scores: {
      Matemáticas: [2.0, 2.5, 3.0, 3.4],
      Lenguaje: [3.8, 3.9, 4.0, 4.1],
      Inglés: [4.5, 4.7, 4.6, 4.8],
      'Ciencias Naturales': [3.2, 3.0, 3.3, 3.1],
    },
  },
  {
    // Was doing well and is now declining.
    firstName: 'Andrés',
    lastName: 'Martínez',
    email: 'andres.martinez@colegio.edu.co',
    gradeLevel: '9A',
    scores: {
      Matemáticas: [4.2, 4.0, 3.4, 3.0],
      Lenguaje: [4.0, 3.6, 3.2, 2.8],
      'Ciencias Sociales': [3.5, 3.6, 3.4, 3.5],
    },
  },
  {
    // Irregular results: big gap between the best and the worst score.
    firstName: 'Valentina',
    lastName: 'Rodríguez',
    email: 'valentina.rodriguez@colegio.edu.co',
    gradeLevel: '10B',
    scores: {
      Matemáticas: [4.5, 2.4, 4.2, 2.6],
      Inglés: [3.0, 4.6, 2.9, 4.4],
      'Ciencias Naturales': [3.9, 4.0, 3.8, 4.1],
    },
  },
  {
    // Superior in every area.
    firstName: 'Santiago',
    lastName: 'López',
    email: 'santiago.lopez@colegio.edu.co',
    gradeLevel: '11A',
    scores: {
      Matemáticas: [4.7, 4.8, 4.9, 5.0],
      Lenguaje: [4.6, 4.7, 4.6, 4.8],
      Inglés: [4.8, 4.9, 4.7, 4.9],
      'Ciencias Naturales': [4.6, 4.6, 4.8, 4.7],
      'Ciencias Sociales': [4.7, 4.9, 4.8, 4.8],
    },
  },
  {
    // Just registered: no grades yet.
    firstName: 'Camila',
    lastName: 'Herrera',
    email: 'camila.herrera@colegio.edu.co',
    gradeLevel: '10B',
    scores: {},
  },
];

// Demo accounts. The admin is created by the API itself from ADMIN_EMAIL.
export const SEED_USERS = [
  {
    email: 'docente@colegio.edu.co',
    password: 'Docente123',
    role: Role.TEACHER,
  },
  {
    email: 'laura.gomez@colegio.edu.co',
    password: 'Estudiante123',
    role: Role.STUDENT,
    studentEmail: 'laura.gomez@colegio.edu.co',
  },
];
