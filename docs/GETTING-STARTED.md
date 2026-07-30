# 🚀 Getting Started Guide

This guide will help you set up and run the Grove Social Learning Platform on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Docker** & **Docker Compose** - [Download here](https://www.docker.com/get-started)
- **Git** - [Download here](https://git-scm.com/downloads)
- **PostgreSQL** (optional, if not using Docker)
- **Redis** (optional, if not using Docker)

## Quick Start (Recommended)

The fastest way to get started is using Docker Compose:

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/grove.git
cd grove
```

### 2. Start Services with Docker

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API server
- Frontend application

### 3. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api

### 4. Stop Services

```bash
docker-compose down
```

---

## Manual Setup

If you prefer to set up the project manually without Docker:

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/grove.git
cd grove
```

### 2. Set Up Environment Variables

#### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/grove"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
PORT=3000
NODE_ENV=development
```

#### Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. Set Up Database

#### Option A: Using Docker for Database Only

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
# Check with: docker-compose ps
```

#### Option B: Local PostgreSQL Installation

Make sure PostgreSQL is installed and running:

```bash
# Create database
createdb grove

# Or using psql
psql -U postgres
CREATE DATABASE grove;
\q
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Set Up Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 6. Start Backend Server

```bash
npm run start:dev
```

The backend will start on http://localhost:3000

### 7. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 8. Start Frontend Server

```bash
npm run dev
```

The frontend will start on http://localhost:3001

---

## Configuration

### Backend Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `PORT` | Backend port | 3000 |
| `NODE_ENV` | Environment | development |

### Frontend Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3000/api |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | http://localhost:3001 |

---

## Third-Party Services Setup

### AWS S3 (for video storage)

1. Create an AWS account
2. Create an S3 bucket
3. Get your access keys
4. Add to backend `.env`:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=grove-uploads
```

### Stripe (for payments)

1. Create a Stripe account
2. Get your API keys
3. Add to backend `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

Add to frontend `.env`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
```

### OAuth2 (Google & Facebook)

#### Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add to backend `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

#### Facebook OAuth2

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app
3. Add Facebook Login product
4. Add to backend `.env`:

```env
FACEBOOK_CLIENT_ID=your-client-id
FACEBOOK_CLIENT_SECRET=your-client-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback
```

---

## Verification

### Check Backend Health

```bash
curl http://localhost:3000/health
```

### Check Frontend

Open http://localhost:3001 in your browser

### Check API Documentation

Open http://localhost:3000/api in your browser

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# View logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Find process using the port
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change ports in .env files
```

### Permission Issues

```bash
# On Linux/Mac, fix permissions
sudo chown -R $USER:$USER .

# On Windows, run as administrator
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests
cd frontend
npm run test
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

---

## Production Deployment

### Build for Production

#### Backend

```bash
cd backend
npm run build
npm run start:prod
```

#### Frontend

```bash
cd frontend
npm run build
npm run start
```

### Docker Production Build

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run production containers
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Ensure you update all environment variables with production values:

- Use strong secrets
- Use production database
- Use production API keys
- Enable SSL/HTTPS
- Configure CORS properly

---

## Next Steps

- Read the [Architecture Documentation](ARCHITECTURE.md)
- Explore the [Features Documentation](FEATURES.md)
- Check the [Project Summary](PROJECT-SUMMARY.md)
- Review the [Contributing Guidelines](../CONTRIBUTING.md)

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/yourusername/grove/issues)
3. Create a new issue with detailed information
4. Contact support at support@grove.com

---

Happy coding! 🎉