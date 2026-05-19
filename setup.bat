@echo off
echo.
echo 🚀 Social Learning Platform - Quick Setup
echo ==========================================
echo.

REM Check prerequisites
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is required but not installed. Aborting.
    exit /b 1
)

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is required but not installed. Aborting.
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Create .env file if it doesn't exist
if not exist backend\.env (
    echo 📝 Creating .env file...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo.
        echo # Database
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learning_platform?schema=public"
        echo.
        echo # JWT
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
        echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
        echo.
        echo # Redis
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo.
        echo # AWS S3
        echo AWS_REGION=us-east-1
        echo AWS_ACCESS_KEY_ID=your-aws-access-key
        echo AWS_SECRET_ACCESS_KEY=your-aws-secret-key
        echo AWS_S3_BUCKET=your-bucket-name
        echo.
        echo # Email
        echo EMAIL_HOST=smtp.gmail.com
        echo EMAIL_PORT=587
        echo EMAIL_USER=your-email@gmail.com
        echo EMAIL_PASSWORD=your-app-password
        echo.
        echo # OAuth2
        echo GOOGLE_CLIENT_ID=your-google-client-id
        echo GOOGLE_CLIENT_SECRET=your-google-client-secret
        echo GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
        echo.
        echo FACEBOOK_APP_ID=your-facebook-app-id
        echo FACEBOOK_APP_SECRET=your-facebook-app-secret
        echo FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback
    ) > backend\.env
    echo ✅ .env file created
) else (
    echo ✅ .env file already exists
)

echo.
echo 🐳 Starting Docker services...
docker-compose up -d

echo.
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install

echo.
echo 🔨 Generating Prisma Client...
call npx prisma generate

echo.
echo 🗄️ Running database migrations...
call npx prisma migrate dev

echo.
echo ✅ Setup complete!
echo.
echo 🚀 Start the backend server:
echo    cd backend ^&^& npm run start:dev
echo.
echo 🌐 Backend will run on: http://localhost:3000
echo 📖 API Documentation: http://localhost:3000/api
echo.
echo 📊 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop services:
echo    docker-compose down
echo.
pause
