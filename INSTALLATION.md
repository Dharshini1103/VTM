# Complete Installation Guide

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 2GB for development

### Required Software
- Java 17 or higher
- Maven 3.6 or higher
- Node.js 16 or higher
- npm 7 or higher
- MySQL 8.0 (optional, H2 is default)

## Installation Steps

### Step 1: Verify Prerequisites

#### Check Java
```bash
java -version
```
Should output Java 17 or higher

#### Check Maven
```bash
mvn -version
```
Should output Maven 3.6 or higher

#### Check Node.js and npm
```bash
node -v
npm -v
```
Should output Node 16+ and npm 7+

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd task-manager-backend

# Install dependencies and build
mvn clean install

# This will:
# - Download all Maven dependencies
# - Compile the Java code
# - Run unit tests
# - Create the JAR file
```

**Expected output:**
```
[INFO] BUILD SUCCESS
```

### Step 3: Start Backend

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using JAR file
java -jar target/voice-enabled-task-manager-1.0.0.jar
```

**Expected output:**
```
Started TaskManagerApplication in X.XXX seconds (JVM running for X.XXX)
```

Backend is ready at: `http://localhost:8080/api`

### Step 4: Verify Backend

Open new terminal:
```bash
# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Step 5: Frontend Setup

```bash
# Navigate to frontend directory
cd task-manager-frontend

# Install dependencies
npm install

# This will:
# - Install all npm packages
# - Create node_modules folder
# - Install React and dependencies
```

**Expected output:**
```
added XXX packages in X.XXs
```

### Step 6: Start Frontend

```bash
npm start
```

**Expected output:**
```
Compiled successfully!
On Your Network: http://192.x.x.x:3000
Local: http://localhost:3000
```

### Step 7: Access Application

1. Open browser: `http://localhost:3000`
2. You should see the login page
3. Click "Register" to create an account

## Quick Start Script

### Linux/macOS
```bash
#!/bin/bash

# Setup backend
echo "Setting up backend..."
cd task-manager-backend
mvn clean install
mvn spring-boot:run &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Setup frontend
echo "Setting up frontend..."
cd ../task-manager-frontend
npm install
npm start &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8080/api"
echo "Frontend running on http://localhost:3000"
echo "Press Ctrl+C to stop"

# Keep running
wait
```

### Windows (PowerShell)
```powershell
# Setup backend
Write-Host "Setting up backend..."
cd task-manager-backend
mvn clean install
Start-Process powershell -ArgumentList "mvn spring-boot:run"

# Wait for backend to start
Start-Sleep -Seconds 10

# Setup frontend
Write-Host "Setting up frontend..."
cd ../task-manager-frontend
npm install
npm start

Write-Host "Backend running on http://localhost:8080/api"
Write-Host "Frontend running on http://localhost:3000"
```

## Docker Setup (Alternative)

### Prerequisites
- Docker installed
- Docker Compose installed

### Docker Compose File

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: task_manager
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build:
      context: ./task-manager-backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/task_manager
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
    depends_on:
      - mysql
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/auth/login"]
      interval: 30s
      timeout: 10s
      retries: 5

  frontend:
    build:
      context: ./task-manager-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      REACT_APP_API_URL: http://localhost:8080/api

volumes:
  mysql_data:
```

### Run with Docker
```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## First Time Setup Checklist

- [ ] Java 17+ installed
- [ ] Maven 3.6+ installed
- [ ] Node.js 16+ installed
- [ ] npm 7+ installed
- [ ] Backend built successfully
- [ ] Backend running on port 8080
- [ ] Frontend installed
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can create task
- [ ] Can assign task to user

## Troubleshooting Installation

### Issue: Java not found
**Solution:**
```bash
# Download Java from https://adoptium.net/
# Set JAVA_HOME environment variable

# Linux/macOS
export JAVA_HOME="/path/to/java"

# Windows (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

### Issue: Maven not found
**Solution:**
```bash
# Download Maven from https://maven.apache.org/download.cgi
# Extract and set M2_HOME

# Linux/macOS
export M2_HOME="/path/to/maven"
export PATH="$M2_HOME/bin:$PATH"

# Windows (PowerShell)
$env:M2_HOME = "C:\Program Files\Apache\maven"
$env:Path += ";$env:M2_HOME\bin"
```

### Issue: Port 8080 already in use
**Solution:**
```bash
# Linux/macOS - Find and kill process
lsof -i :8080
kill -9 <PID>

# Windows - Find and kill process
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm start
```

### Issue: npm ERR! code ERESOLVE
**Solution:**
```bash
# Use legacy peer deps
npm install --legacy-peer-deps

# Or update npm
npm install -g npm@latest
```

### Issue: Maven build failure
**Solution:**
```bash
# Clear Maven cache
mvn clean

# Delete .m2 folder and reinstall
rm -rf ~/.m2/repository
mvn clean install

# Check Java version compatibility
java -version
```

### Issue: Backend won't start
**Solution:**
```bash
# Check logs
mvn spring-boot:run -X

# Verify H2 database
# H2 console should be available at:
# http://localhost:8080/api/h2-console

# Check database file permissions
chmod 755 ~/task_manager_db.h2.db
```

### Issue: Frontend won't compile
**Solution:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v
npm -v

# Install with legacy deps
npm install --legacy-peer-deps
```

## Development Workflow

### Daily Startup
```bash
# Terminal 1: Backend
cd task-manager-backend
mvn spring-boot:run

# Terminal 2: Frontend
cd task-manager-frontend
npm start
```

### Making Changes

**Backend:**
1. Edit Java files
2. Backend auto-recompiles (if using DevTools)
3. Refresh browser to see changes

**Frontend:**
1. Edit React/JS files
2. Frontend auto-reloads
3. Check browser console for errors

### Testing Endpoints

Use Postman or curl:
```bash
# Test register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "gmailId":"user@gmail.com",
    "firstName":"John",
    "lastName":"Doe",
    "password":"password123"
  }'

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123"
  }'
```

## Next Steps

1. Read [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed backend configuration
2. Read [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) for detailed frontend setup
3. Read [README.md](./README.md) for API documentation
4. Create your first task
5. Test voice command processing
6. Schedule a meeting

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review log files in `logs/application.log`
3. Check browser console (F12)
4. Visit project repository for issues
5. Refer to official documentation:
   - Spring Boot: https://spring.io/projects/spring-boot
   - React: https://react.dev
   - Maven: https://maven.apache.org
   - npm: https://docs.npmjs.com

## System Specifications

### Successfully Tested On
- Windows 10/11 with Java 17 + Maven 3.8.6 + Node 18
- macOS 12+ with Java 17 + Maven 3.8.6 + Node 16
- Ubuntu 20.04 with Java 17 + Maven 3.8.6 + Node 16
- Docker Desktop with Docker Compose

### Performance Baseline
- Backend startup: ~5-10 seconds
- Frontend startup: ~10-15 seconds
- Total startup time: ~20-30 seconds
- Database initialization: ~2-3 seconds
