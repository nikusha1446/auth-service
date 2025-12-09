# Auth Service

A standalone authentication microservice API built with Node.js and TypeScript.

## Features

- **User Registration** with email verification
- **JWT Authentication** with access and refresh tokens
- **Refresh Token Rotation** for enhanced security
- **Password Reset** flow with email
- **Google OAuth** login
- **Protected Routes** middleware
- **Rate Limiting** to prevent brute force attacks
- **Audit Logs** for tracking user actions

## Tech Stack

- Node.js with TypeScript
- Express
- PostgreSQL with Prisma ORM
- JWT for authentication
- Argon2 for password hashing
- Resend for emails
- Zod for validation

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Installation

1. Clone the repository:

```bash
git clone https://github.com/nikusha1446/auth-service.git
cd auth-service
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_service?schema=public"
RESEND_API_KEY=your-resend-api-key
APP_URL="http://localhost:3000"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN_DAYS="7"
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

6. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/verify-email` | Verify email address | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout (invalidate refresh token) | No |
| POST | `/auth/logout-all` | Logout from all devices | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |

### OAuth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/google` | Initiate Google OAuth flow | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |

### User

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/me` | Get current user profile | Yes |
| GET | `/auth/audit-logs` | Get user's login history | Yes |

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |

## Usage Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'
```

### Access protected route

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer your-access-token"
```

### Refresh tokens

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── common/
│   ├── middleware/     # Middleware files
│   ├── services/       # Shared services
│   └── utils/          # Utility functions
├── config/             # Configuration files
├── generated/          # Generated Prisma client
├── modules/
│   ├── auth/           # Authentication module
│   └── health/         # Health check module
├── app.ts              # Express app setup
└── index.ts            # Entry point
```

## Security Features

- **Password Hashing**: Argon2 algorithm
- **JWT Tokens**: Short-lived access tokens (15 min)
- **Refresh Token Rotation**: New refresh token on each use
- **Rate Limiting**: Protects against brute force attacks
- **Email Verification**: Required before login
- **Audit Logging**: Tracks all authentication events

## License

ISC
