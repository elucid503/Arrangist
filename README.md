# SmartAssign

## Summary

SmartAssign is an automated time management application that intelligently sorts and schedules tasks based on urgency, due date, and estimated completion time. The system bridges the gap between overly complex tools and basic to-do lists, offering a balance of simplicity and smart functionality.

## Features

### Implemented High-Priority Features

#### Calendar Management
- Create, view, edit, and delete calendar events

#### Task Management
- Create tasks with title, description, due date, category, priority, estimated time, and status

#### Schedule Automation
- Analyze available time slots between scheduled events

## Tech Stack

### Backend
- **Runtime**: Bun
- **Framework**: Hono (lightweight, fast HTTP framework)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Language**: TypeScript

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Language**: TypeScript
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- **Bun**: Install from [bun.sh](https://bun.sh)

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   - Update the values as needed

4. Run the development server:
   ```bash
   bun run dev
   ```

   The Backend will then start on `http://localhost:3000`

### Frontend Setup

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   - Ensure `VITE_API_URL` points to the Backend API entry point (default: `http://localhost:3000/api`)

4. Run the development server:
   ```bash
   bun run dev
   ```

   The Frontend will start on `http://localhost:5173` (or whatever port Vite is configured for)

### Building for Production

#### Backend
```bash
cd Backend
bun run build
bun run start
```

#### Frontend
```bash
cd Frontend
bun run build
bun run preview
```

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/users/register
Body: { Name, Email, Password }
Response: { message, user, token }
```

#### Login
```
POST /api/users/login
Body: { Email, Password }
Response: { message, user, token }
```

#### Get Profile
```
GET /api/users/profile
Headers: { Authorization: "Bearer <token>" }
Response: { user }
```

### Task Endpoints

All task endpoints require authentication.

#### Create Task
```
POST /api/tasks
Body: { Title, Description?, DueDate?, Priority, EstimatedTime?, Category?, Status? }
Response: { message, task }
```

#### Get All Tasks
```
GET /api/tasks?category=&priority=&status=&sortBy=
Response: { tasks, count }
```

#### Get Task by ID
```
GET /api/tasks/:id
Response: { task }
```

#### Update Task
```
PUT /api/tasks/:id
Body: { Title?, Description?, DueDate?, Priority?, EstimatedTime?, Category?, Status? }
Response: { message, task }
```

#### Delete Task
```
DELETE /api/tasks/:id
Response: { message }
```

#### Add Subtask
```
POST /api/tasks/:id/subtasks
Body: { Title, IsCompleted? }
Response: { message, task }
```

#### Update Subtask
```
PUT /api/tasks/:id/subtasks/:subtaskId
Body: { Title?, IsCompleted? }
Response: { message, task }
```

#### Delete Subtask
```
DELETE /api/tasks/:id/subtasks/:subtaskId
Response: { message, task }
```

### Calendar Endpoints

All calendar endpoints require authentication.

#### Create Event
```
POST /api/calendar/events
Body: { Title, Description?, StartTime, EndTime, Location?, Category?, Color?, IsRecurring?, Recurrence?, Reminders?, IsAllDay? }
Response: { message, event }
```

#### Get All Events
```
GET /api/calendar/events?startDate=&endDate=&category=
Response: { events, count }
```

#### Get Event by ID
```
GET /api/calendar/events/:id
Response: { event }
```

#### Update Event
```
PUT /api/calendar/events/:id
Body: { Title?, Description?, StartTime?, EndTime?, Location?, Category?, Color?, IsRecurring?, Recurrence?, Reminders?, IsAllDay? }
Response: { message, event }
```

#### Delete Event
```
DELETE /api/calendar/events/:id
Response: { message }
```

#### Export Calendar to ICS
```
GET /api/calendar/export/ics?startDate=&endDate=
Response: ICS file download
```

### Schedule Endpoints

All schedule endpoints require authentication.

#### Get Schedule Suggestions
```
GET /api/schedule/suggestions?startDate=&endDate=
Response: { message, suggestions, count }
```

#### Apply Suggestion
```
POST /api/schedule/apply
Body: { TaskId, ScheduledStart, ScheduledEnd }
Response: { message, task }
```

#### Reschedule Task
```
POST /api/schedule/reschedule/:id
Response: { message, task, newSuggestion }
```

## Scheduling Algorithm

The scheduling automation uses a sophisticated algorithm that:

1. **Calculates Priority Scores**:
   - Base priority (high=100, medium=50, low=25)
   - Due date urgency (sooner = higher score)
   - Bonus for tasks with estimated time

2. **Finds Available Time Slots**:
   - Analyzes calendar events
   - Identifies gaps between commitments
   - Considers preferred working hours (9 AM - 9 PM default)

3. **Matches Tasks to Slots**:
   - Sorts tasks by priority score
   - Matches task duration to available slots
   - Prefers slots within preferred time range
   - Automatically reschedules on conflicts
