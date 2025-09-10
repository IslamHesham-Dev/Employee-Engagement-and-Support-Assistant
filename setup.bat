@echo off
echo 🚀 Setting up HR HelpDesk Development Environment
echo ==================================================

echo 📋 Checking requirements...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not installed. You'll need to set up PostgreSQL manually.
)

echo ✅ Requirements check completed

echo 📝 Setting up environment files...

if not exist "hrhelpdesk\backend\.env" (
    copy "hrhelpdesk\backend\.env.example" "hrhelpdesk\backend\.env" >nul
    echo ✅ Created backend\.env from example
) else (
    echo ⚠️  backend\.env already exists, skipping...
)

if not exist "hrhelpdesk\frontend\.env" (
    copy "hrhelpdesk\frontend\.env.example" "hrhelpdesk\frontend\.env" >nul
    echo ✅ Created frontend\.env from example
) else (
    echo ⚠️  frontend\.env already exists, skipping...
)

if not exist "hrhelpdesk\FAQchatbot\.env" (
    copy "hrhelpdesk\FAQchatbot\.env.example" "hrhelpdesk\FAQchatbot\.env" >nul
    echo ✅ Created FAQchatbot\.env from example
) else (
    echo ⚠️  FAQchatbot\.env already exists, skipping...
)

echo 📦 Installing dependencies...

echo Installing root dependencies...
call npm install

echo Installing backend dependencies...
cd hrhelpdesk\backend
call npm install
cd ..\..

echo Installing frontend dependencies...
cd hrhelpdesk\frontend
call npm install
cd ..\..

echo Installing AI chatbot dependencies...
cd hrhelpdesk\FAQchatbot
call pip install -r requirements.txt
cd ..\..

echo ✅ All dependencies installed

echo 🗄️  Setting up database...

where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo Starting PostgreSQL with Docker...
    docker-compose up -d postgres
    
    echo Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
    
    echo Running database migrations...
    cd hrhelpdesk\backend
    call npx prisma migrate dev
    call npx prisma db seed
    cd ..\..
    
    echo ✅ Database setup completed
) else (
    echo ⚠️  Docker not available. Please set up PostgreSQL manually and run:
    echo    cd hrhelpdesk\backend ^&^& npx prisma migrate dev ^&^& npx prisma db seed
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Update the .env files with your actual API keys and configuration
echo 2. Start the development servers:
echo    npm run dev
echo.
echo Access the application at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   Chatbot:  http://localhost:5000
echo.
echo Happy coding! 🚀
pause


