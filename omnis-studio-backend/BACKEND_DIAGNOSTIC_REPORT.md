# Backend Diagnostic Report — Omnis Studio

## Root Cause

The build was **exiting with code 0 but producing no `dist/` output** due to a chain of interacting issues:

### 1. `module: "ESNext"` in TypeScript 6 produces zero emit

The `tsconfig.json` had `"module": "ESNext"`. On TypeScript 6.0.3, this setting caused the compiler to skip **all** JavaScript emission (`Emit time: 0.00s` in diagnostics). Every other module value (`ES2022`, `NodeNext`, `commonjs`) emitted files correctly. This is a behavioral change in TypeScript 6 — `ESNext` no longer triggers the emit phase in certain configurations.

### 2. Stale `.tsbuildinfo` incremental cache perpetuated the zero-emit state

Because `"incremental": true` was set, TypeScript wrote a `.tsbuildinfo` file after the first failed build. On every subsequent `tsc` invocation, the compiler read that cached state, concluded that "nothing changed since last build" (i.e., still nothing to emit), and skipped emission again — **even after the module setting was fixed**. The stale cache acted as a poison pill.

The `.tsbuildinfo` file lived at the project root and was **not** cleaned by `nest build` (which only runs `tsc -p tsconfig.build.json` with `deleteOutDir: true` — the `deleteOutDir` only removes `dist/`, not root-level metadata files).

### 3. Prisma v7 generated extensionless imports, incompatible with Node.js ESM

The `prisma-client` generator (Prisma v7's default) produced TypeScript files with bare imports:

```ts
// Generated, no extension
import * as $Class from "./internal/class";
```

When compiled to ESM JavaScript, these imports stayed extensionless. **Node.js ESM requires explicit file extensions** in relative imports. The `--experimental-specifier-resolution=node` flag is unavailable/removed in Node.js 22.22.2, so there was no built-in way to resolve these paths at runtime.

### 4. CJS mode was blocked by Prisma v7's ESM-only runtime

When we attempted to switch the entire project to CommonJS, the generated client code used `require()`, which then tried to load `@prisma/client/runtime/*.mjs` files. Node.js cannot `require()` an ESM `.mjs` file from a CJS context, throwing `ReferenceError: exports is not defined in ES module scope`.

---

## Files Changed

| File | Change |
|---|---|
| `tsconfig.json` | `module: "ESNext"` → `"ES2022"`; `moduleResolution: "bundler"`; added `tsBuildInfoFile: "./dist/.tsbuildinfo"`; removed `ignoreDeprecations`; removed root-level `include` for `prisma.config.ts` |
| `tsconfig.build.json` | Replaced inline content with clean `extends` + `exclude` |
| `prisma/schema.prisma` | Added `importFileExtension = "js"` and `moduleFormat = "esm"` to `generator client` block |
| `nest-cli.json` | Removed `typeCheck` (tsc-only); removed redundant builder default; kept `deleteOutDir: true` |
| `package.json` | Removed `"start": "nest start --watch --tsc"` → `"start": "nest start"`, `"start:dev": "nest start --watch --tsc"`, `"start:prod": "node dist/main"` |
| `src/main.ts` | Restored `.js` extension on `./app.module.js` import |
| `src/app.module.ts` | Restored `.js` extensions on all local imports |
| `src/app.controller.ts` | Restored `.js` extension on `./app.service.js` import |
| `src/prisma/prisma.service.ts` | Restored `.js` extension on `../generated/prisma/client.js` import |
| `src/prisma/prisma.module.ts` | Restored `.js` extension on `./prisma.service.js` import |

---

## Why Each Change Was Needed

### `tsconfig.json`

- **`module: "ES2022"`** — The only ESM module target that reliably emits JavaScript files with TypeScript 6.0.3. Produces identical `import`/`export` syntax to `ESNext`.
- **`moduleResolution: "bundler"`** — Required companion for `module: "ES2022"`. Allows extensionless imports in `.ts` source files while outputting `.js` extension imports.
- **`tsBuildInfoFile: "./dist/.tsbuildinfo"`** — Moves the incremental build cache inside `dist/`. Since `nest-cli.json` sets `deleteOutDir: true`, every `nest build` now deletes the stale cache alongside the output, preventing the incremental-cache poisoning problem.
- **Removed `"include": ["prisma.config.ts"]`** — This file lives at the project root, outside `rootDir: "./src"`. TypeScript would either error or silently skip it. It's only needed by the Prisma CLI, not by the NestJS compiler.

### `tsconfig.build.json`

- Clean `extends` + `exclude` ensures the production build only compiles `src/` and nothing else.

### `prisma/schema.prisma`

- **`importFileExtension = "js"`** — Tells the Prisma v7 generator to emit `"./internal/class.js"` instead of `"./internal/class"` in all generated imports. This is the fix that makes Prisma's output compatible with Node.js ESM strict mode.
- **`moduleFormat = "esm"`** — Explicitly sets the generated module format to ESM (the default in v7, but explicit is better).

### `nest-cli.json`

- Removed `typeCheck: true` — This flag only applies to the SWC builder; it emits a warning when used with the `tsc` builder.

### `package.json`

- **`"type": "module"`** — Required for Node.js to treat `.js` files as ES modules. Without it, `node dist/main` would attempt CJS loading.
- **Scripts**: `nest start` (build + run), `nest start --watch --tsc` (development watch mode), `node dist/main` (production direct execution).

### Source files (`.js` extensions)

- Node.js ESM requires explicit file extensions in relative imports. Removing them would cause `ERR_MODULE_NOT_FOUND` at runtime.

---

## Current Architecture

```
omnis-studio-backend/
├── prisma/
│   ├── schema.prisma              User model + generator config (importFileExtension=js)
│   ├── migrations/                Initial "init" migration (users table)
│   └── migration_lock.toml
├── src/
│   ├── main.ts                    NestJS bootstrap (listens on PORT 4000)
│   ├── app.module.ts              Root module: ConfigModule (global) + PrismaModule
│   ├── app.controller.ts          GET / health-check → "Omnis-Studio API"
│   ├── app.service.ts             Service layer
│   ├── prisma/
│   │   ├── prisma.module.ts       Global @Module({ exports: [PrismaService] })
│   │   └── prisma.service.ts      Extends PrismaClient, injects ConfigService for DATABASE_URL
│   └── generated/prisma/          Auto-generated by prisma generate (gitignored)
├── prisma.config.ts               Prisma v7 CLI config (datasource URL)
├── nest-cli.json                  NestJS CLI: tsc builder, deleteOutDir
├── tsconfig.json                  ES2022 + bundler + strict + decorators
├── tsconfig.build.json            Extends tsconfig.json, excludes test/ and node_modules/
└── package.json                   type: module, ESM scripts
```

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22.22.2, ESM (`"type": "module"`) |
| Framework | NestJS 11.1.24 |
| Compiler | TypeScript 6.0.3 via `tsc` builder |
| Database | PostgreSQL 18 (local) |
| ORM | Prisma 7.8.0 (`prisma-client` generator, driver adapter) |
| Database Adapter | `@prisma/adapter-pg` + `pg` |
| Dev Mode | `nest start --watch --tsc` (compiles + watches + restarts) |

### Data Flow

1. `main.ts` creates `NestFactory.create(AppModule)`
2. `AppModule` imports `ConfigModule.forRoot({ isGlobal: true })` which reads `.env`
3. `AppModule` also imports `PrismaModule` (global)
4. `PrismaService` constructor receives `ConfigService`, creates `PrismaPg` adapter with `DATABASE_URL`, and calls `super({ adapter })`
5. `onModuleInit` calls `this.$connect()` to establish the PostgreSQL connection pool
6. `AppController` serves `GET /` returning `"Omnis-Studio API"`

---

## Verification

### Build works
```bash
$ npm run build
> build
> nest build
# exit 0 — no errors, no warnings
```

### `dist/main.js` exists
```bash
$ ls -la dist/main.js
-rw-rw-r-- 1 mrcyber mrcyber 362 Jun  1 09:10 dist/main.js
```

### NestJS starts successfully
```bash
$ timeout 3 node dist/main
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [NestFactory] Starting Nest application...
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [InstanceLoader] ConfigHostModule dependencies initialized +7ms
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [InstanceLoader] AppModule dependencies initialized +2ms
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [InstanceLoader] ConfigModule dependencies initialized +0ms
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [InstanceLoader] PrismaModule dependencies initialized +0ms
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [RoutesResolver] AppController {/}: +2ms
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [RouterExplorer] Mapped {/, GET} route +1ms
[Nest] 29398  - 06/01/2026, 9:10:36 AM    LOG [NestApplication] Nest application successfully started +56ms
Omnis-Studio API running on http://localhost:4000
```

### Dev watch mode works
```bash
$ npm run start:dev
> nest start --watch --tsc
[9:10:14 AM] Starting compilation in watch mode...
[9:10:15 AM] Found 0 errors. Watching for file changes.
[Nest] 29290  - 06/01/2026, 9:10:15 AM    LOG [NestApplication] Nest application successfully started
```

### Database connection works
```bash
$ sudo -u postgres psql -d omnis_studio -c "\d users"
                                  Table "public.users"
   Column   |              Type              | Collation | Nullable |      Default
------------+--------------------------------+-----------+----------+-------------------
 id         | uuid                           |           | not null |
 email      | text                           |           | not null |
 password   | text                           |           | not null |
 credits    | integer                        |           | not null | 10
 created_at | timestamp(3) without time zone |           | not null | CURRENT_TIMESTAMP
 updated_at | timestamp(3) without time zone |           | not null | NOW()
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE, btree (email)
```

### Prisma Client generation
```bash
$ npx prisma generate
✔ Generated Prisma Client (7.8.0) to ./src/generated/prisma in 32ms
```

---

## Next Recommended Step

### Authentication & User Management

The project has a `User` model and working database connectivity. The immediate next steps should be:

#### 1. Registration endpoint (`POST /auth/register`)
- DTO with `email`, `password` validation using `class-validator`
- Hash password with `bcrypt` (already in dependencies)
- Create user in database via `PrismaService`
- Return user (excluding password)

#### 2. Login endpoint (`POST /auth/login`)
- Validate credentials
- Compare password hash
- Issue JWT access token

#### 3. JWT authentication guard
- `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`
- Extract token from `Authorization: Bearer` header
- Attach user to `request.user`

#### 4. Credits system
- `GET /auth/me` — return authenticated user with credit balance
- Middleware/guard to check credits on protected routes
- Admin endpoint to grant credits

### Implementation order
```
1. AuthModule ──> 2. Prisma User queries ──> 3. bcrypt hashing ──> 4. JWT strategy
──> 5. Guards ──> 6. Credits middleware ──> 7. Role/permission system
```
