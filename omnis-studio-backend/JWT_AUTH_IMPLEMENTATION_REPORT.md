# Files Created
- src/auth/dto/login.dto.ts
- src/auth/guards/jwt-auth.guard.ts
- src/auth/strategies/jwt.strategy.ts

# Files Modified
- src/auth/auth.controller.ts
- src/auth/auth.module.ts
- src/auth/auth.service.ts
- .env
- package.json
- package-lock.json

# Installed Packages
- @nestjs/jwt
- @nestjs/passport
- passport
- passport-jwt
- @types/passport-jwt (dev)

# Authentication Flow
1. Client posts credentials to `POST /auth/login`.
2. AuthService looks up the user by email.
3. bcrypt compares the provided password with `passwordHash`.
4. On success, JwtService signs a JWT payload `{ sub, email }`.
5. Protected routes use `JwtAuthGuard`, which validates the Bearer token.
6. JwtStrategy loads the user and returns `{ id, email, credits, createdAt }`.

# JWT Payload Structure
```json
{
  "sub": "user-id",
  "email": "user@example.com"
}
```

# Example Login Request
```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "12345678"
}
```

# Example Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

# Example Authenticated Request
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

# Example Authenticated Response
```json
{
  "id": "9f159680-f023-47ff-82a6-93aa0b844667",
  "email": "test_1780334314172@example.com",
  "credits": 10,
  "createdAt": "2026-06-01T17:18:34.314Z"
}
```

# Security Notes
- `passwordHash` is never returned in any response.
- `JWT_SECRET` is required at startup and loaded via ConfigService.
- Invalid credentials return 401 Unauthorized.
- Invalid or missing tokens return 401 Unauthorized.

# Verification Results
- `POST /auth/register` -> 201 Created
- `POST /auth/login` (valid credentials) -> 200 OK
- `GET /auth/me` (valid token) -> 200 OK
- `POST /auth/login` (invalid password) -> 401 Unauthorized
- `GET /auth/me` (invalid token) -> 401 Unauthorized

# Auth Folder Tree
```
src/auth/
├── auth.controller.ts
├── auth.module.ts
├── auth.service.ts
├── dto/
│   ├── login.dto.ts
│   └── register.dto.ts
├── guards/
│   └── jwt-auth.guard.ts
└── strategies/
    └── jwt.strategy.ts
```

# Example Access Token Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

# Example /auth/me Response
```json
{
  "id": "9f159680-f023-47ff-82a6-93aa0b844667",
  "email": "test_1780334314172@example.com",
  "credits": 10,
  "createdAt": "2026-06-01T17:18:34.314Z"
}
```

# Manual Actions Still Required
- Set `JWT_SECRET` to a strong value for production deployments.
