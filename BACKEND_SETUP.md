# Backend Setup Guide

## Quick Start

### 1. Prerequisites Installation

```bash
# Check Java version (17 or higher required)
java -version

# Check Maven version (3.6 or higher required)
mvn -version
```

### 2. Backend Startup

```bash
# Navigate to backend directory
cd task-manager-backend

# Build and run with Maven
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080/api`

### 3. Database

By default, H2 in-memory database is configured. Access H2 console:
```
http://localhost:8080/api/h2-console
```

**Credentials:**
- Username: `sa`
- Password: (leave empty)

## Project Structure

```
src/main/
├── java/com/taskmanager/
│   ├── TaskManagerApplication.java      # Main application class
│   ├── config/
│   │   ├── SecurityConfig.java          # JWT & Spring Security config
│   │   └── CorsConfig.java              # CORS configuration
│   ├── controller/
│   │   ├── AuthController.java          # Auth endpoints
│   │   ├── TaskController.java          # Task CRUD endpoints
│   │   ├── UserController.java          # User management
│   │   ├── VoiceCommandController.java  # Voice processing
│   │   └── MeetingController.java       # Meeting scheduling
│   ├── dto/
│   │   ├── UserDTO.java
│   │   ├── TaskDTO.java
│   │   ├── VoiceCommandDTO.java
│   │   ├── request/                     # Request DTOs
│   │   └── response/                    # Response DTOs
│   ├── entity/
│   │   ├── User.java                    # User entity
│   │   ├── Task.java                    # Task entity
│   │   └── VoiceCommand.java            # Voice command entity
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java  # Exception handling
│   │   ├── ResourceNotFoundException.java
│   │   ├── UnauthorizedException.java
│   │   ├── DuplicateResourceException.java
│   │   └── BadRequestException.java
│   ├── repository/
│   │   ├── UserRepository.java          # User data access
│   │   ├── TaskRepository.java          # Task data access
│   │   └── VoiceCommandRepository.java  # Voice command data access
│   ├── security/
│   │   ├── JwtTokenProvider.java        # JWT token generation/validation
│   │   ├── JwtAuthenticationFilter.java # JWT filter
│   │   ├── JwtAuthenticationEntryPoint.java
│   │   └── CustomUserDetailsService.java
│   └── service/
│       ├── UserService.java             # User business logic
│       ├── TaskService.java             # Task business logic
│       ├── VoiceCommandService.java     # Voice processing logic
│       └── GoogleCalendarService.java   # Google Calendar integration
└── resources/
    └── application.yml                  # Application configuration
```

## Configuration

### JWT Configuration

Update `application.yml`:
```yaml
app:
  jwt:
    secret-key: "your-very-long-256-bit-secret-key-for-hs256-algorithm"
    expiration: 86400000  # 24 hours
```

### Google Calendar Integration

To enable Google Calendar/Meet integration:

1. Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Download credentials.json
3. Update path in `application.yml`
4. Implement OAuth2 flow in `GoogleCalendarService`

### Database Configuration

For MySQL instead of H2:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/task_manager
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    database-platform: org.hibernate.dialect.MySQL8Dialect
    hibernate:
      ddl-auto: update
```

## API Endpoints Overview

### Authentication (No auth required)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Tasks (Auth required)
- `POST /tasks` - Create task
- `GET /tasks/{taskId}` - Get task details
- `GET /tasks/user/my-tasks` - Get user's tasks
- `GET /tasks/user/assigned` - Get assigned tasks
- `GET /tasks/upcoming` - Get upcoming tasks
- `GET /tasks/overdue` - Get overdue tasks
- `PUT /tasks/{taskId}` - Update task
- `PATCH /tasks/{taskId}/complete` - Complete task
- `PATCH /tasks/{taskId}/assign/{userId}` - Assign task
- `DELETE /tasks/{taskId}` - Delete task

### Voice (Auth required)
- `POST /voice/process` - Process voice command
- `GET /voice/{commandId}` - Get voice command details
- `GET /voice/user/commands` - Get user's voice commands
- `POST /voice/{commandId}/mark-processed` - Mark as processed

### Meetings (Auth required)
- `POST /meetings/schedule-meet` - Schedule Google Meet
- `POST /meetings/schedule-call` - Schedule call
- `POST /meetings/sync/{taskId}` - Sync with calendar

### Users (Auth required)
- `GET /users/me` - Get current user
- `GET /users/{userId}` - Get user by ID
- `GET /users` - Get all team members
- `PUT /users/{userId}` - Update user
- `DELETE /users/{userId}` - Deactivate user

## Key Features Implementation

### 1. JWT Authentication
- Token-based authentication
- 24-hour expiration (configurable)
- Secure password hashing with BCrypt

### 2. Voice Command Processing
Intent detection using regex patterns:
- `SCHEDULE_CALL/MEETING` - "schedule a call/meet..."
- `CREATE_TASK` - "create a task..."
- `UPDATE_TASK` - "update the task..."
- `MARK_COMPLETE` - "mark task as completed..."
- `ASSIGN_TASK` - "assign task to..."
- `NONE` - No action, just voice-to-text

### 3. Task Management
- Full CRUD operations
- Priority levels: LOW, MEDIUM, HIGH, URGENT
- Status tracking: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD
- Deadline management
- Team member assignment

### 4. Call Scheduling
- Google Meet integration
- Multiple call types: PHONE_CALL, GOOGLE_MEET, ZOOM_CALL, TEAMS_CALL
- Explicit scheduling (no auto-triggers)
- Calendar event creation

## Error Handling

All errors follow consistent format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional context",
  "timestamp": "2026-01-28T10:30:00"
}
```

Custom exceptions:
- `ResourceNotFoundException` - 404
- `UnauthorizedException` - 401
- `DuplicateResourceException` - 409
- `BadRequestException` - 400

## Logging

Configured in `application.yml`:
```yaml
logging:
  level:
    root: INFO
    com.taskmanager: DEBUG
  file:
    name: logs/application.log
```

## Testing

Run tests:
```bash
mvn test
```

Test files location: `src/test/java/com/taskmanager/`

## Building for Production

```bash
# Create JAR
mvn clean package

# Run JAR
java -jar target/voice-enabled-task-manager-1.0.0.jar
```

## Troubleshooting

### Port already in use
```bash
# Change port in application.yml
server:
  port: 8081
```

### Database connection issues
- Check MySQL is running (if using MySQL)
- Verify credentials in application.yml
- Check database exists

### JWT errors
- Verify secret key is at least 256 bits
- Check token not expired
- Ensure Authorization header format: `Bearer <token>`

## Performance Tips

1. Enable query logging only in development
2. Use pagination for large result sets
3. Add database indexes for frequently queried columns
4. Cache user and team member data
5. Implement rate limiting for API endpoints

## Security Checklist

- [ ] Change default JWT secret key
- [ ] Update CORS origins for production
- [ ] Enable HTTPS
- [ ] Set secure database password
- [ ] Configure firewall rules
- [ ] Enable SQL injection prevention
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure CSRF protection
- [ ] Use environment variables for secrets
