# Integrated Voice-Enabled Task Manager

A professional-grade, production-ready task management system with integrated voice command support, built with **Spring Boot** (backend) and **React** (frontend).

## 📋 Features

### Core Features
- ✅ **Task Management**: Create, read, update, delete, and assign tasks
- ✅ **Voice Commands**: Convert voice to text and process task-related intents
- ✅ **Meeting Scheduling**: Schedule calls and Google Meet directly from tasks
- ✅ **Team Collaboration**: Assign tasks to team members by Gmail ID
- ✅ **Task Tracking**: Monitor task status, priority, and deadlines
- ✅ **Calendar Integration**: Sync tasks with Google Calendar

### Key Design Rules
- Assigning a task does NOT automatically schedule a call
- Calls/meetings are scheduled only on explicit voice or text commands
- Voice input is never auto-triggered
- Clean separation between task management and communication

## 🏗️ Architecture

### Backend (Spring Boot)
```
task-manager-backend/
├── pom.xml (Maven configuration)
├── src/main/
│   ├── java/com/taskmanager/
│   │   ├── TaskManagerApplication.java
│   │   ├── config/          (Security, CORS, etc.)
│   │   ├── controller/       (REST API endpoints)
│   │   ├── dto/             (Data Transfer Objects)
│   │   ├── entity/          (JPA entities)
│   │   ├── exception/       (Custom exceptions)
│   │   ├── repository/      (Data access layer)
│   │   ├── security/        (JWT & Auth)
│   │   └── service/         (Business logic)
│   └── resources/
│       └── application.yml  (Configuration)
└── src/test/                (Unit tests)
```

### Frontend (React)
```
task-manager-frontend/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── api/                 (API clients)
    ├── components/          (Reusable components)
    ├── pages/              (Page components)
    ├── slices/             (Redux slices)
    ├── App.js
    ├── store.js
    └── index.js
```

## 🚀 Getting Started

### Prerequisites
- **Java 17+**
- **Maven 3.6+**
- **Node.js 16+**
- **npm or yarn**
- **MySQL 8.0+** (optional, H2 is configured by default)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd task-manager-backend
   ```

2. **Install dependencies and build**
   ```bash
   mvn clean install
   ```

3. **Configure application** (optional)
   Edit `src/main/resources/application.yml`:
   ```yaml
   # Update JWT secret (minimum 256 bits)
   app:
     jwt:
       secret-key: "your-256-bit-secret-key-here"
       expiration: 86400000  # 24 hours in milliseconds
   
   # Update Google Calendar credentials path if needed
   app:
     google:
       calendar:
         credentials-path: /path/to/credentials.json
   ```

4. **Run the backend**
   ```bash
   mvn spring-boot:run
   ```
   
   Backend will start on `http://localhost:8080/api`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd task-manager-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint** (optional)
   Create `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:8080/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   Frontend will open on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "gmailId": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securepassword"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    }
  }
}
```

### Task Endpoints

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project proposal",
  "description": "Finish the Q1 project proposal document",
  "priority": "HIGH",
  "deadline": "2026-02-15T17:00:00",
  "assignedToId": 2
}
```

#### Get User Tasks
```http
GET /tasks/user/my-tasks
Authorization: Bearer <token>
```

#### Update Task
```http
PUT /tasks/{taskId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM"
}
```

#### Complete Task
```http
PATCH /tasks/{taskId}/complete
Authorization: Bearer <token>
```

#### Delete Task
```http
DELETE /tasks/{taskId}
Authorization: Bearer <token>
```

### Voice Command Endpoints

#### Process Voice Command
```http
POST /voice/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Schedule a Google Meet with Dharshini for this task tomorrow at 4 PM",
  "taskId": 1,
  "audioBase64": "optional_base64_audio_data"
}
```

**Intent Detection Examples:**
- "Schedule a Google Meet..." → `SCHEDULE_MEETING`
- "Create a new task..." → `CREATE_TASK`
- "Mark this task as completed" → `MARK_COMPLETE`
- "Assign this task to John" → `ASSIGN_TASK`
- "Any random text" → `NONE` (just voice-to-text conversion)

### Meeting Endpoints

#### Schedule Google Meet
```http
POST /meetings/schedule-meet
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": 1,
  "callType": "GOOGLE_MEET",
  "scheduledDateTime": "2026-02-15T16:00:00",
  "meetingTitle": "Project Discussion",
  "description": "Discuss project requirements"
}
```

#### Schedule Call
```http
POST /meetings/schedule-call
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": 1,
  "callType": "ZOOM_CALL",
  "scheduledDateTime": "2026-02-15T16:00:00",
  "meetingTitle": "Team Sync",
  "description": "Weekly team synchronization"
}
```

### User Endpoints

#### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

#### Get All Team Members
```http
GET /users
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /users/{userId}
Authorization: Bearer <token>
```

#### Update User
```http
PUT /users/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "profilePhoto": "https://example.com/photo.jpg"
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: BCrypt hashing for passwords
- **CORS Protection**: Configured for specific origins
- **SQL Injection Prevention**: JPA parameterized queries
- **Input Validation**: Comprehensive validation using Jakarta Validation

## 📊 Use Cases Implemented

1. **UC-01: Create Task** - Users can create tasks with title, description, priority, and deadline
2. **UC-02: Assign Task** - Assign tasks to team members by Gmail ID
3. **UC-03: Voice-to-Text Conversion** - Convert voice input to text without triggering actions
4. **UC-04: Schedule Call via Voice** - Schedule calls explicitly via voice commands
5. **UC-05: Schedule Google Meet** - Create Google Meet for specific tasks
6. **UC-06: Choose Call Type** - Support multiple call types (Phone, Meet, Zoom, Teams)
7. **UC-07: Clarification for Incomplete Input** - Ask for missing details in voice commands
8. **UC-08: Manual Task Update** - Update tasks without voice commands
9. **UC-09: Voice-Triggered Task Actions** - Mark tasks complete via voice
10. **UC-10: Permission & Safety Handling** - Notify users of missing permissions

## 🧪 Testing

### Backend Tests
```bash
cd task-manager-backend
mvn test
```

### Frontend Tests
```bash
cd task-manager-frontend
npm test
```

## 📦 Production Deployment

### Backend (Docker)
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/voice-enabled-task-manager-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend (Docker)
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

### Database

For production, update `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/task_manager
    username: your_db_user
    password: your_db_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    database-platform: org.hibernate.dialect.MySQL8Dialect
    hibernate:
      ddl-auto: validate
```

## 🔄 Workflow Example

1. **User creates a task** via UI or voice command
2. **Task is saved** in database with PENDING status
3. **No automatic call is scheduled** (per design rule)
4. **Later, user explicitly requests** "Schedule a Google Meet for this task"
5. **System detects intent** as `SCHEDULE_MEETING`
6. **Google Meet is created** and linked to task
7. **Meeting details are stored** in task record

## 🛠️ Technology Stack

### Backend
- Spring Boot 3.2.1
- Spring Data JPA
- Spring Security
- JWT (JSON Web Tokens)
- H2 Database (default) / MySQL
- Google Calendar API
- Maven

### Frontend
- React 18.2.0
- Redux Toolkit for state management
- Ant Design UI Library
- Axios for HTTP client
- React Router for navigation
- Tailwind CSS for styling

## 📝 Environment Variables

### Backend
```properties
JWT_SECRET_KEY=your-256-bit-secret-key
JWT_EXPIRATION=86400000
GOOGLE_CALENDAR_CREDENTIALS_PATH=/path/to/credentials.json
```

### Frontend
```
REACT_APP_API_URL=http://localhost:8080/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

## 🎯 Future Enhancements

- [ ] Advanced NLP for better voice intent detection
- [ ] Slack/Teams integration
- [ ] Task templates and automation
- [ ] Analytics and reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Calendar view for tasks
- [ ] Task dependencies and subtasks
- [ ] File attachments for tasks
- [ ] Task comments and discussions
- [ ] Advanced search and filtering

---

**Created**: January 28, 2026
**Version**: 1.0.0
**Status**: Production Ready
