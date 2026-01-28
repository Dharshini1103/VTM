# MySQL Setup Guide for IVTM

## Prerequisites
- MySQL Server installed on your machine
- MySQL Workbench (for database management)

## Setup Instructions

### 1. Install MySQL (if not already installed)
Download and install from: https://dev.mysql.com/downloads/mysql/

### 2. Create the Database
Run the following SQL commands in MySQL Workbench or MySQL CLI:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS task_manager;

-- Use the database
USE task_manager;
```

### 3. Configure MySQL Connection
The application is already configured to connect to MySQL with these credentials:
- **Host**: localhost
- **Port**: 3306
- **Database**: task_manager
- **Username**: root
- **Password**: root

If your MySQL credentials are different, update `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/task_manager?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: YOUR_USERNAME
    password: YOUR_PASSWORD
```

### 4. Start MySQL Server
```bash
# Windows (if installed as a service)
# MySQL should start automatically, or use:
mysql.server start

# Or start MySQL from command line:
mysqld
```

### 5. Run the Application
The application will automatically create all required tables when it starts (using Hibernate's `ddl-auto: update`).

```bash
cd backend
mvn spring-boot:run
```

### 6. Verify Database in MySQL Workbench

1. Open MySQL Workbench
2. Create a new connection or use existing localhost connection
3. Login with username: `root` and password: `root`
4. You'll see the `task_manager` database with these tables:
   - `users` - Stores user registration data
   - `tasks` - Stores tasks
   - `voice_commands` - Stores voice command history

### 7. Test Registration and Login

**Register a user:**
```bash
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "gmailId": "user.gmail@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123"
}
```

**Login with the same credentials:**
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

The user can now login multiple times, even after application restart, because data is persisted in MySQL.

### 8. View Data in MySQL Workbench

```sql
-- View all registered users
USE task_manager;
SELECT * FROM users;

-- View all tasks
SELECT * FROM tasks;

-- View login attempts (via voice commands if applicable)
SELECT * FROM voice_commands;
```

## Troubleshooting

### Connection Refused Error
- Ensure MySQL Server is running
- Check if MySQL is listening on port 3306
- Verify credentials in application.yml

### Database Not Found
- Create the `task_manager` database manually using the SQL commands above
- Ensure the database name matches in application.yml

### Table Not Created
- Check application logs for Hibernate DDL errors
- Ensure JPA is properly configured
- Verify entity annotations are correct

## Notes
- Hibernate will automatically create tables on first run
- Data persists across application restarts
- You can use MySQL Workbench to manage, query, and backup the database
- Change credentials in `application.yml` if you use different MySQL credentials
