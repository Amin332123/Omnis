# Image Generation with Flux + OpenAI — Integration Report

## Summary
Added a multi-provider image generation flow to Omnis Studio. The user picks
**Flux** or **OpenAI** as the provider, then picks the exact model/version
they want. The frontend talks to a single endpoint, which dispatches to the
correct provider on the backend. All real, working models are listed — anything
that does not work on the current OpenAI account was removed from the UI.

## Working Models (verified end-to-end)

### OpenAI (5 models)
| Key | Label | Notes |
| --- | --- | --- |
| `gpt-image-1` | GPT Image 1 | Default |
| `gpt-image-1.5` | GPT Image 1.5 | |
| `gpt-image-1-mini` | GPT Image 1 Mini | Fastest GPT image |
| `gpt-image-2` | GPT Image 2 | Newest |
| `gpt-image-2-2026-04-21` | GPT Image 2 (pinned) | Reproducible outputs |

### Flux (3 models via fal.ai)
| Key | Label |
| --- | --- |
| `flux-schnell` | Flux Schnell (1-4 steps) |
| `flux-dev` | Flux Dev (~28 steps) |
| `flux-pro` | Flux Pro 1.1 (premium) |

**Removed** from the UI because they returned 400 "model does not exist" on
this account: `dall-e-2`, `dall-e-3`, `chatgpt-image-latest`. The backend
still accepts them as legacy values for backwards compatibility, but the
frontend no longer surfaces them.

## Files Created
- `omnis-studio-backend/src/openai/openai.module.ts`
- `omnis-studio-backend/src/openai/openai.service.ts`
- `omnis-studio-backend/src/openai/openai.models.ts`
- `omnis-studio-backend/src/fal/fal.models.ts`

## Files Modified

### Backend
- `omnis-studio-backend/.env` — added `OPENAI_API_KEY`.
- `omnis-studio-backend/src/config/env.validation.ts` — `OPENAI_API_KEY` is
  now a required env var.
- `omnis-studio-backend/src/fal/fal.service.ts` — refactored to support
  `flux-schnell`, `flux-dev`, `flux-pro` via a per-model endpoint table.
- `omnis-studio-backend/src/generations/dto/create-image-generation.dto.ts`
  — new optional fields `provider` and `modelVersion` (legacy `model` kept).
- `omnis-studio-backend/src/generations/generations.service.ts` — resolves
  provider + model, dispatches to the right service, persists
  `<provider>:<modelId>` so history shows what was used.
- `omnis-studio-backend/src/generations/generations.module.ts` — imports
  `OpenAIModule`.

### Frontend
- `omnis-studio/src/lib/generations-api.ts` — new types
  `ImageProvider`, `FluxModelVersion`, `OpenAIModelVersion`. The request
  payload accepts `provider` and `modelVersion`; the response includes
  `provider` and `model`.
- `omnis-studio/src/lib/static-data.ts` — added `PROVIDER_OPTIONS`,
  `FLUX_MODEL_OPTIONS`, `OPENAI_MODEL_OPTIONS`.
- `omnis-studio/src/app/dashboard/generate/images/page.tsx` —
  **rewritten end-to-end**:
  - Prompt area with character counter and quality heuristic.
  - **Provider** picker (Flux / OpenAI) with side-by-side cards.
  - **Model version** picker that swaps between Flux versions and OpenAI
    models, with description, speed and quality tags.
  - Aspect ratio, style, and quality controls.
  - Live "Summary" panel inside the cost box.
  - Result panel with **Download**, **Regenerate**, **Compare**,
    **Copy URL**, **Open**, and **Fullscreen** controls — all wired to
    real, working actions.

### Pre-existing files (not touched, still working)
- All other dashboard pages (`/dashboard`, `/dashboard/billing`,
  `/dashboard/history`, `/dashboard/settings`,
  `/dashboard/generate/videos`).
- Auth flow, registration, login, JWT.
- History card, dashboard stat cards, sidebar, top nav.

## How to Run

### Backend
```bash
cd omnis-studio-backend
npm install      # if needed
npm run build
npm run start:dev
```
The server listens on `http://127.0.0.1:4000`.

### Frontend
```bash
cd omnis-studio
npm install
npm run dev
```
Visit `http://localhost:3000`. Sign in, then go to
`/dashboard/generate/images`.

## How to Test

1. Open `/dashboard/generate/images`.
2. Type a prompt, e.g. *"a small origami crane on a wooden table"*.
3. Click **Provider → OpenAI** → pick **GPT Image 1** → click **Generate
   Image**.
4. Wait ~5-20s — the image renders. Click **Download** to save the PNG.
5. Click **Regenerate** to re-run with the same model, or change to
   **Flux Pro** and click **Generate Image** to see a different result.
6. Click **Compare** to open the side-by-side dialog. Pick **Flux → Flux
   Dev** and click **Run comparison**. The dialog shows both images and
   lets you **Use this result** to adopt the comparison as the main
   image, or **Download** it.
7. Click the image (or the fullscreen icon) to open the fullscreen
   viewer. Use **- / +** to zoom, **Download** to save, or **Esc** to
   close.

### End-to-end smoke (curl)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"verysecret"}' \
  http://localhost:4000/auth/register

TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"verysecret"}' \
  http://localhost:4000/auth/login | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')

# OpenAI
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"a tiny red bicycle on a foggy morning","provider":"openai","modelVersion":"gpt-image-1"}' \
  http://localhost:4000/generations/image

# Flux Pro
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"a tiny red bicycle on a foggy morning","provider":"flux","modelVersion":"flux-pro"}' \
  http://localhost:4000/generations/image
```

## Cost
- 1 image = 2 credits (unchanged; `IMAGE_COST` in
  `generations.service.ts`).
- OpenAI / fal.ai charges are absorbed by the platform accounts; credits
  are the Omnis Studio internal cost.

## Error Handling (Backend)
- Missing API key → server fails fast at startup.
- `401` / `403` / `404` / `429` from provider are mapped to clean HTTP
  exceptions (e.g. 402 for quota, 404 for "model not on this account",
  429 for rate limit, 504 for timeout, 503 for upstream 5xx).
- Transient failures (timeouts, network, 408/429/5xx) are retried with
  backoff `[750ms, 1500ms]`.

## Frontend Robustness
- Buttons that can't act (e.g. **Copy URL** on a base64 image) are
  disabled with a clear tooltip.
- Generate is disabled while loading or when credits are insufficient.
- The summary panel always shows the active provider + model so the user
  is never confused about what they're about to send.
- Compare button is disabled when there aren't enough credits.

## Verified
- Backend `npm run build` ✓
- Frontend `npx tsc --noEmit` ✓
- Frontend `npm run build` ✓ (all 12 routes generated)
- Backend live API tested with all 8 working models → each returns a
  real `imageUrl` (base64 for OpenAI, https URL for Flux) and decrements
  credits by 2.
- Pre-existing routes (landing, login, register, dashboard, history,
  billing, settings, generate/videos) still load.
