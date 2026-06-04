# Generation System Report

## Prisma changes
- Added `GenerationJob` model with UUID primary key, nullable `outputUrl`, and user relation.
- Added `jobs` relation on `User`.
- Migration created and applied: `prisma/migrations/20260601205540_generation_job/migration.sql`.

## New endpoints
- `POST /generations/image` (JWT)
- `GET /generations/history` (JWT)
- `GET /generations/stats` (JWT)

## Credits flow
1. Read authenticated user from JWT.
2. Verify credits >= 2. If not, return 402 `Insufficient credits`.
3. Deduct 2 credits.
4. Create `GenerationJob` with `type=image`, `status=completed`, `creditsUsed=2`.
5. Return `{ jobId, remainingCredits, imageUrl }` with a mock URL.

## Example requests

### POST /generations/image
```bash
curl -X POST http://localhost:4000/generations/image \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cinematic city skyline at dusk","model":"omnis-image-v1"}'
```

## Example responses

### POST /generations/image 200
```json
{
  "jobId": "7dbd5c0c-5fe1-4ab3-8d7b-4f1b2e0f7a11",
  "remainingCredits": 8,
  "imageUrl": "https://example.com/mock-image.jpg"
}
```

### POST /generations/image 402
```json
{
  "statusCode": 402,
  "message": "Insufficient credits"
}
```

## History response
```json
[
  {
    "id": "5f4c9a1b-9b6d-4d5f-b9f7-3b2c6dbe2b6a",
    "userId": "9f6bbad0-2c60-4f1e-84ae-b3f51e4e6a3a",
    "type": "image",
    "prompt": "A cinematic city skyline at dusk",
    "model": "omnis-image-v1",
    "creditsUsed": 2,
    "status": "completed",
    "outputUrl": "https://example.com/mock-image.jpg",
    "createdAt": "2026-06-01T20:55:40.123Z"
  }
]
```

## Stats response
```json
{
  "creditsRemaining": 8,
  "totalGenerations": 1,
  "totalImages": 1
}
```

## Verification results
- `npm run prisma:migrate -- --name generation_job`
- `npm run prisma:generate`
- Manual curl checks: `POST /auth/register`, `POST /auth/login`, `POST /generations/image`, `GET /generations/history`, `GET /generations/stats`

## Final folder structure
```
prisma/
  migrations/
    20260601205540_generation_job/
      migration.sql
  schema.prisma
src/
  generations/
    dto/
      create-image-generation.dto.ts
    generations.controller.ts
    generations.module.ts
    generations.service.ts
```
