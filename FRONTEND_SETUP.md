# Frontend Setup Guide

## Quick Start

### 1. Prerequisites Installation

```bash
# Check Node.js version (16 or higher required)
node -v

# Check npm version (7 or higher required)
npm -v
```

### 2. Frontend Startup

```bash
# Navigate to frontend directory
cd task-manager-frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will open on `http://localhost:3000`

## Project Structure

```
src/
├── api/
│   ├── axiosClient.js       # Axios instance with interceptors
│   ├── authApi.js           # Authentication API
│   ├── taskApi.js           # Task API
│   ├── userApi.js           # User API
│   ├── voiceApi.js          # Voice command API
│   └── meetingApi.js        # Meeting API
├── components/
│   └── Navigation.js        # Navigation bar component
├── pages/
│   ├── Login.js             # Login page
│   ├── Register.js          # Registration page
│   ├── Dashboard.js         # Dashboard/home page
│   ├── Tasks.js             # Tasks list page
│   ├── TaskDetail.js        # Task detail page
│   ├── CreateTask.js        # Create task page
│   ├── VoiceInput.js        # Voice input page
│   ├── ScheduleMeeting.js   # Schedule meeting page
│   ├── TeamMembers.js       # Team members page
│   └── Profile.js           # User profile page
├── slices/
│   ├── authSlice.js         # Auth Redux slice
│   ├── taskSlice.js         # Task Redux slice
│   ├── userSlice.js         # User Redux slice
│   └── voiceSlice.js        # Voice Redux slice
├── App.js                   # Main App component
├── App.css                  # App styles
├── store.js                 # Redux store configuration
├── index.js                 # React entry point
└── index.css                # Global styles
```

## Configuration

### API Configuration

Update API base URL in `.env`:
```
REACT_APP_API_URL=http://localhost:8080/api
```

Default: `http://localhost:8080/api` (via proxy in package.json)

### Axios Interceptors

`api/axiosClient.js` automatically:
- Adds JWT token to all requests
- Handles 401 unauthorized responses
- Redirects to login on token expiry

## Available Pages

### Public Pages (No authentication required)
1. **Login** (`/login`) - User login
2. **Register** (`/register`) - New user registration

### Protected Pages (Authentication required)
1. **Dashboard** (`/`) - Overview with stats and recent tasks
2. **Tasks** (`/tasks`) - Task list with filtering
3. **Create Task** (`/tasks/new`) - Create new task
4. **Task Detail** (`/tasks/:taskId`) - View and edit task
5. **Voice Input** (`/voice`) - Voice command processing
6. **Schedule Meeting** (`/meetings/schedule`) - Schedule calls/meetings
7. **Team Members** (`/team`) - View team members
8. **Profile** (`/profile`) - User profile and settings

## Redux State Management

### Auth State (`authSlice`)
```javascript
{
  isAuthenticated: boolean,
  user: UserObject,
  token: string,
  loading: boolean,
  error: string
}
```

### Task State (`taskSlice`)
```javascript
{
  tasks: Task[],
  selectedTask: Task,
  loading: boolean,
  error: string,
  filter: {
    status: string,
    priority: string
  }
}
```

### User State (`userSlice`)
```javascript
{
  users: User[],
  teamMembers: User[],
  currentUser: User,
  loading: boolean,
  error: string
}
```

### Voice State (`voiceSlice`)
```javascript
{
  commands: VoiceCommand[],
  isRecording: boolean,
  lastCommand: VoiceCommand,
  loading: boolean,
  error: string
}
```

## Key Features

### 1. Authentication Flow
- JWT token-based authentication
- Tokens stored in localStorage
- Auto-redirect to login on expiry
- Secure logout with token removal

### 2. Task Management
- Create tasks with priority and deadline
- Assign to team members
- Update task status
- Mark as complete
- Delete tasks
- Filter by status and priority
- Search tasks

### 3. Voice Commands
- Record voice or enter text
- Intent detection
- Command history
- Support for multiple call types

### 4. Meeting Scheduling
- Schedule Google Meet
- Schedule Zoom, Teams, or Phone calls
- Calendar integration
- Meeting link generation

### 5. Team Collaboration
- View team members
- Assign tasks to members
- View member details

## Component Hierarchy

```
App
├── Navigation (if authenticated)
├── Routes
    ├── Login
    ├── Register
    ├── Dashboard
    ├── Tasks
    ├── TaskDetail
    ├── CreateTask
    ├── VoiceInput
    ├── ScheduleMeeting
    ├── TeamMembers
    └── Profile
```

## Styling

Uses **Ant Design** component library with custom CSS:
- Responsive design
- Dark theme support
- Mobile-friendly UI
- Consistent color scheme

Global styles in `index.css`:
```css
- Color scheme
- Typography
- Layout defaults
- Button styles
- Utility classes
```

## API Integration

### Example: Fetching Tasks

```javascript
import taskApi from '../api/taskApi';
import { useEffect, useState } from 'react';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    taskApi.getUserTasks()
      .then(response => setTasks(response.data.data))
      .catch(error => console.error(error));
  }, []);
  
  return (
    // Render tasks
  );
}
```

### Example: Creating Task

```javascript
const handleCreate = async (values) => {
  try {
    const response = await taskApi.createTask({
      title: values.title,
      priority: values.priority,
      deadline: values.deadline.toISOString(),
      assignedToId: values.assignedToId
    });
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

## Building for Production

### Development Build
```bash
npm start
```

### Production Build
```bash
npm run build
```

Creates optimized build in `/build` directory.

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Environment Variables

Create `.env` file in root:
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ENV=development
```

## Performance Optimization

### 1. Code Splitting
React Router automatically code-splits pages

### 2. Lazy Loading
```javascript
import { lazy } from 'react';
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 3. Memoization
```javascript
import { memo } from 'react';
const TaskCard = memo(({ task }) => (...));
```

### 4. Image Optimization
- Use appropriate image sizes
- Compress images
- Use WebP format

## Security Best Practices

1. **Never store sensitive data in localStorage**
   - Tokens are necessary but keep secure
   - Clear on logout

2. **Validate user input**
   - Form validation
   - Sanitize content
   - Use HTTPS only in production

3. **CORS Configuration**
   - Configured on backend
   - Only allow trusted origins

4. **XSS Prevention**
   - React auto-escapes content
   - Use dangerouslySetInnerHTML carefully

5. **CSRF Protection**
   - Use SameSite cookie attribute
   - Validate token origin

## Deployment

### Docker
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
  location /api {
    proxy_pass http://backend:8080/api;
  }
}
```

### Vercel / Netlify
```bash
npm run build
# Deploy /build folder
```

## Troubleshooting

### Port already in use
```bash
# Use different port
PORT=3001 npm start
```

### Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### API connection issues
- Check backend is running on correct port
- Verify REACT_APP_API_URL in .env
- Check CORS configuration on backend
- Review browser console for errors

### Redux not working
- Check store configuration
- Verify slices are imported
- Check action dispatches

### Voice recording not working
- Browser must support getUserMedia
- HTTPS required in production
- Check microphone permissions
- Use modern browser (Chrome, Firefox, Edge)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Metrics

Target metrics:
- Lighthouse score: 90+
- First Contentful Paint: < 2s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1

## Dependencies

- **react**: UI library
- **react-router-dom**: Navigation
- **redux**: State management
- **antd**: Component library
- **axios**: HTTP client
- **dayjs**: Date manipulation
