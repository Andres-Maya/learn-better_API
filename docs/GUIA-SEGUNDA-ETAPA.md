# Guía de la segunda etapa

Esta guía es para quien continúa el proyecto. Explica qué ya está hecho, cómo preparar tu equipo y qué tareas faltan para terminar la API, en el orden en que conviene hacerlas.

---

## 1. Dónde estamos

La API ya funciona completa en local. Estos son los pasos del plan:

| # | Paso | Estado |
|---|---|---|
| 1 | Modelos de dominio | ✅ |
| 2 | DTOs con validación | ✅ |
| 3 | Servicios y lógica de recomendaciones | ✅ |
| 4 | Controladores REST | ✅ |
| 5 | PostgreSQL, TypeORM, migraciones y Docker Compose | ✅ |
| 6 | Usuarios, login con JWT y roles | ✅ |
| 7 | Documentación con Swagger | ✅ |
| 8 | Pruebas unitarias | ✅ |
| 9 | Filtro de errores, Helmet, límite de peticiones y health check | ✅ |
| 10 | Datos de ejemplo (`npm run seed`) | ✅ |
| 11 | Pruebas e2e | ✅ |
| **12** | **Dockerfile de producción, integración continua y despliegue** | ⬜ **te toca** |
| extra | Gestión de usuarios, cambio de contraseña, paginación y reporte por grado | ⬜ te toca |

Para terminar el proyecto hace falta el **paso 12**. Las tareas extra lo mejoran, pero la API funciona sin ellas.

---

## 2. Preparar tu equipo

### 2.1 Requisitos

- Node.js 20 o superior y npm
- Docker Desktop
- Git
- Una cuenta de GitHub con acceso al repositorio `Andres-Maya/learn-better_API`. Pídele al dueño que te agregue como colaborador en **Settings → Collaborators**.

### 2.2 Usar tu propia cuenta de Git en un computador compartido

Si trabajas en un computador donde ya hay otra cuenta de Git configurada, configura tu nombre y tu correo **solo para este repositorio**. Así tus commits salen a tu nombre sin cambiar la configuración de la otra persona:

```bash
git clone https://github.com/Andres-Maya/learn-better_API.git
cd learn-better_API

# Sin --global: aplica solo a esta carpeta
git config user.name "Tu nombre o usuario de GitHub"
git config user.email "el-correo-de-tu-cuenta-de-github@ejemplo.com"

# Comprueba que quedó bien
git config user.name
git config user.email
```

Usa el mismo correo que tienes registrado en GitHub. Si no, GitHub no enlaza los commits a tu perfil.

**Para subir cambios con tu cuenta:** en macOS, el llavero puede tener guardada la sesión de otra persona para `github.com`. Si al hacer `git push` sale un error 403 o los cambios aparecen con otra cuenta:

1. Abre **Acceso a Llaveros**, busca `github.com` y borra esa entrada. También puedes ejecutar `printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase`.
2. En GitHub, crea un token en **Settings → Developer settings → Personal access tokens** con permiso `repo`.
3. En el siguiente `git push`, usa tu usuario de GitHub y pega el token como contraseña.

> Cuando la otra persona vuelva a usar su cuenta, tendrá que hacer lo mismo con la suya. Si prefieres no tocar el llavero, usa una llave SSH propia y cambia el remoto con `git remote set-url origin git@github.com:Andres-Maya/learn-better_API.git`.

### 2.3 Levantar el proyecto

```bash
npm install
cp .env.example .env      # luego edita los valores
docker compose up -d      # PostgreSQL en el DB_PORT del .env
npm run migration:run     # crea las tablas
npm run seed              # opcional: datos de ejemplo
npm run start:dev
```

En `.env`, genera un `JWT_SECRET` propio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Si `3000` o `5432` ya están ocupados en tu equipo, cambia `PORT` o `DB_PORT` en `.env`.

Comprueba que todo funciona:

```bash
npm run lint
npm test            # 65 pruebas unitarias
npm run test:e2e    # 38 pruebas e2e, necesitan PostgreSQL arriba
```

Abre `http://localhost:3000/docs` e inicia sesión con `POST /auth/login`. Puedes usar el admin de tu `.env` o las cuentas del seed, que están en el README.

---

## 3. Cómo trabajamos

- **Nunca** se hace commit directo en `main`. Crea una rama por tarea: `git checkout -b feature/dockerfile`.
- Haz commits pequeños con el formato `tipo: descripción` en español: `feat`, `fix`, `refactor`, `test`, `docs` o `chore`.
- Al terminar, sube la rama (`git push -u origin feature/dockerfile`) y abre un Pull Request hacia `main`.
- Antes de abrir el PR, corre: `npm run lint && npm test && npm run test:e2e && npm run build`.
- Antes de empezar cada tarea, actualiza tu copia: `git checkout main && git pull`.

---

## 4. Tareas

### Tarea 1: Dockerfile de producción (paso 12, obligatoria)

**Objetivo:** que la API corra en un contenedor listo para producción.

**Qué hacer:**

1. Crea `Dockerfile` en la raíz con **dos etapas**:
   - `build`: `node:24-alpine`, `npm ci`, `npm run build`.
   - `runtime`: `node:24-alpine`, `npm ci --omit=dev`, copia `dist/` desde la etapa `build`, `ENV NODE_ENV=production`, usa el usuario `node` (no root) y expone el puerto 3000.
2. Comando de arranque: primero las migraciones y luego la API.
   ```sh
   npx typeorm migration:run -d dist/database/data-source.js && node dist/main
   ```
   No uses `npm run migration:run` dentro del contenedor: ese script compila de nuevo y necesita las dependencias de desarrollo.
3. Crea `.dockerignore` con al menos: `node_modules`, `dist`, `coverage`, `.env`, `.git`, `test`.
4. En `docker-compose.yml`, agrega un servicio `api` que use el `Dockerfile`, dependa de `postgres` y reciba las variables del `.env`. Dentro de Docker, `DB_HOST` debe ser `postgres`, no `localhost`.
5. Agrega un `HEALTHCHECK` que llame a `GET /health`.

**Listo cuando:** `docker compose up --build` levanta la base de datos y la API, `http://localhost:3000/health` responde `200` y se puede iniciar sesión desde `/docs`.

> `src/database/data-source.ts` solo lee `.env` si el archivo existe. En el contenedor, las variables llegan por el entorno, así que funciona sin cambios.

### Tarea 2: Integración continua con GitHub Actions (paso 12, obligatoria)

**Objetivo:** que cada Pull Request se revise automáticamente.

**Qué hacer:** crea `.github/workflows/ci.yml` que, en cada `push` y `pull_request`:

1. Instale Node 24 y corra `npm ci`.
2. Corra `npm run lint`, `npm test` y `npm run build`.
3. Corra `npm run test:e2e` con un servicio `postgres:17-alpine`. Define en el workflow las variables `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` (de 32 caracteres o más), `ADMIN_EMAIL` y `ADMIN_PASSWORD`. En CI no hay `.env`, y la configuración de las pruebas toma estas variables del entorno.

**Listo cuando:** el PR muestra la marca verde. En **Settings → Branches**, protege `main` para que no se pueda unir un PR con la CI en rojo.

### Tarea 3: Despliegue (paso 12, obligatoria)

**Objetivo:** dejar la API publicada en internet.

**Qué hacer:**

1. Elige un proveedor que soporte Docker y PostgreSQL, por ejemplo Render, Railway o Fly.io.
2. Crea la base de datos PostgreSQL administrada y el servicio desde el `Dockerfile`.
3. Configura las variables de entorno en el panel del proveedor:
   - Un `JWT_SECRET` nuevo y largo. **Nunca** uses el del `.env.example`.
   - Un `ADMIN_PASSWORD` fuerte.
   - Los datos de conexión de la base de datos administrada.
4. Configura `/health` como ruta de health check del proveedor.
5. Si un frontend va a consumir la API desde otro dominio, activa CORS en `src/app.setup.ts` con `app.enableCors({ origin: ... })`. Toma el dominio permitido de una variable nueva, `CORS_ORIGIN`, que debes agregar también a `src/config/env.validation.ts`.

**Listo cuando:** la URL pública responde en `/health` y `/docs`, y el README tiene una sección "Despliegue" con la URL y los pasos.

> En producción no ejecutes `npm run seed`. Crea los usuarios reales con `POST /auth/register`.

### Tarea 4: Gestión de usuarios (extra)

**Objetivo:** que el ADMIN pueda listar, editar y borrar usuarios. Hoy solo puede crearlos.

**Qué hacer:**

- Crea `src/users/users.controller.ts` con `GET /users`, `GET /users/:id`, `PATCH /users/:id` y `DELETE /users/:id`, todas con `@Roles(Role.ADMIN)`.
- Crea `UpdateUserDto` con `PartialType`, importado de `@nestjs/swagger`, **no** de `@nestjs/mapped-types`.
- Devuelve siempre `PublicUserDto` usando `toPublicUser()`, para que nunca salga el `passwordHash`.
- Reglas: un admin no se puede borrar a sí mismo, y no se puede borrar ni degradar al último ADMIN.
- Agrega pruebas unitarias en `users.service.spec.ts` y pruebas e2e.

### Tarea 5: Cambio de contraseña (extra)

- Crea `PATCH /auth/password`, abierta a cualquier usuario con sesión, con `currentPassword` y `newPassword` (mínimo 8 y máximo 72 caracteres).
- Verifica la contraseña actual con `compare` de `bcryptjs` y guarda la nueva con `hash`, como en `UsersService.create`.
- Opcional, más avanzado: un refresh token con su propia tabla y migración.

### Tarea 6: Paginación y búsqueda (extra)

- Crea un `PaginationQueryDto` en `src/common/` con `page` (mínimo 1) y `limit` (de 1 a 100). Usa `@Type(() => Number)`, como en `FilterGradesDto`.
- Aplícalo en `GET /students`, `GET /areas` y `GET /grades`, y responde `{ data, total, page, limit }` usando `findAndCount`.
- En `GET /students`, agrega `?search=` para buscar por nombre o apellido con `ILike`.
- Esto **cambia la forma de la respuesta**: actualiza las pruebas e2e que esperan un arreglo y el README.

### Tarea 7: Reporte por grado (extra)

- Crea `GET /recommendations/grade-levels/:gradeLevel` con `@Roles(Role.ADMIN, Role.TEACHER)`.
- Respuesta: promedio del grado por materia, cuántos estudiantes hay en cada nivel (BAJO, BÁSICO, ALTO y SUPERIOR) y la lista de estudiantes en riesgo (promedio general menor a 3.0).
- Reutiliza `RecommendationsService.analyzeStudent` para cada estudiante del grado. Para eso, agrega a `StudentsService` un método que busque por `gradeLevel`.

---

## 5. Cómo está organizado el código

- **Un módulo por recurso** (`students`, `areas`, `grades`, `users`, `auth`, `recommendations` y `health`), cada uno con controlador, servicio, entidad y DTOs. Sigue el mismo patrón.
- **Todas las rutas piden token.** Para hacer una ruta pública, usa `@Public()`. Para limitarla por rol, usa `@Roles(Role.ADMIN, ...)`. Una ruta sin `@Roles` está abierta a cualquier usuario con sesión.
- **Datos de un estudiante:** cuando una ruta devuelva información de un estudiante, llama a `assertCanAccessStudent(user, studentId)` de `src/auth/student-access.ts`, para que un STUDENT no vea datos ajenos. El usuario actual se obtiene con `@CurrentUser()`.
- **Interfaces en parámetros con decoradores:** usa `import type`, por ejemplo `import type { AuthenticatedUser } from '../auth/jwt-payload'`. Si no, TypeScript falla con el error TS1272.
- **Cambios en las tablas:** modifica la entidad y luego ejecuta `npm run migration:generate -- src/database/migrations/NombreDelCambio`. Revisa el archivo generado, aplícale `npx prettier --write` y ejecuta `npm run migration:run`. Nunca uses `synchronize: true`.
- **Errores:** lanza las excepciones de Nest (`NotFoundException`, `ConflictException`, etc.). El filtro global les da la misma forma a todas.
- **Swagger:** el plugin de `nest-cli.json` documenta solo los DTOs y las entidades. Un comentario `/** ... */` sobre un método del controlador aparece como su descripción, y `/** @example ... */` sobre un campo da el ejemplo.

---

## 6. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `Variables de entorno inválidas` al arrancar | Falta una variable en `.env`, o `JWT_SECRET` tiene menos de 32 caracteres. Compara con `.env.example`. |
| `EADDRINUSE` o la base de datos no arranca | El puerto ya está ocupado. Cambia `PORT` o `DB_PORT` en `.env`. |
| `429 Too Many Requests` mientras pruebas a mano | Hay un límite de 5 logins por minuto. Espera un minuto. Las pruebas automáticas no tienen límite. |
| Las e2e fallan con `database ... does not exist` | PostgreSQL no está arriba (`docker compose up -d`) o el usuario de `.env` no puede crear bases de datos. |
| En las e2e desaparece el admin | Para limpiar las tablas usa `DELETE` y no `TRUNCATE ... CASCADE`: `users` depende de `students`. Revisa `resetDatabase` en `test/utils/test-app.ts`. |
| `git push` responde 403 | Git está usando la cuenta de otra persona. Revisa la sección 2.2. |
