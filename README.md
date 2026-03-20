# Student Course System — Microservices Architecture

**Laboratory 1: Monolithic vs Microservices Architecture (SAR2)**
ITSAR2 313 – System Integration and Architecture 2

##  Members

- BOMBATE, RIZZA
- ENGRACIAL, QUENNIE
- IGNALAGUE, RODNEY
- REBLANDO, ANTON
- SAUSA, EDEN CARL


---

A microservices-based web application for managing students, courses, and enrollments. Built with **Node.js**, **Express**, **SQLite (sql.js)**, and **Vanilla JavaScript**.

## Architecture

The system is split into three independent microservices plus an API gateway:

| Service            | Port | Database               | Description                        |
|--------------------|------|------------------------|------------------------------------|
| API Gateway        | 3000 | —                      | Reverse proxy + serves frontend    |
| Student Service    | 3001 | `students.sqlite`      | CRUD operations for students       |
| Course Service     | 3002 | `courses.sqlite`       | CRUD operations for courses        |
| Enrollment Service | 3003 | `enrollments.sqlite`   | Manages student-course enrollments |

- Each service runs independently on its own port with its own SQLite database.
- Services communicate exclusively via HTTP requests (no shared databases).
- Cascade deletion is handled through inter-service HTTP calls.
- All IDs use auto-increment integers for simplicity and performance.


## Project Structure

```
├── api-gateway/               # Reverse proxy + frontend
│   ├── server.js
│   └── public/
│       ├── index.html
│       ├── script.js
│       └── styles.css
├── student-service/           # Student microservice
│   ├── server.js
│   ├── models/studentModel.js
│   ├── controllers/studentController.js
│   ├── routes/studentRoutes.js
│   └── middleware/
├── course-service/            # Course microservice
│   ├── server.js
│   ├── models/courseModel.js
│   ├── controllers/courseController.js
│   ├── routes/courseRoutes.js
│   └── middleware/
├── enrollment-service/        # Enrollment microservice
│   ├── server.js
│   ├── models/enrollmentModel.js
│   ├── controllers/enrollmentController.js
│   ├── routes/enrollmentRoutes.js
│   └── middleware/
├── seed.js                    # Populates sample data via HTTP
└── package.json               # Root scripts for all services
```

## API Endpoints

### Student Service (Port 3001)
Accessible via API Gateway at `http://localhost:3000/students`

| Method   | Endpoint         | Description                        |
|----------|------------------|------------------------------------|
| `POST`   | `/students`      | Create a new student               |
| `GET`    | `/students`      | Get all students                   |
| `GET`    | `/students/:id`  | Get a student by ID                |
| `PUT`    | `/students/:id`  | Update a student                   |
| `DELETE` | `/students/:id`  | Delete a student + enrollments     |

### Course Service (Port 3002)
Accessible via API Gateway at `http://localhost:3000/courses`

| Method   | Endpoint        | Description                        |
|----------|-----------------|-----------------------------------|
| `POST`   | `/courses`      | Create a new course                |
| `GET`    | `/courses`      | Get all courses                    |
| `GET`    | `/courses/:id`  | Get a course by ID                 |
| `PUT`    | `/courses/:id`  | Update a course                    |
| `DELETE` | `/courses/:id`  | Delete a course + enrollments      |

### Enrollment Service (Port 3003)
Accessible via API Gateway at `http://localhost:3000/enrollments`

| Method   | Endpoint                       | Description                                      |
|----------|--------------------------------|--------------------------------------------------|
| `POST`   | `/enrollments`                 | Enroll a student in a course                     |
| `GET`    | `/enrollments`                 | Get all enrollments                              |
| `GET`    | `/enrollments/student/:id`     | Get enrollments for a student                    |
| `DELETE` | `/enrollments/student/:id`     | Remove enrollments by student (inter-service)    |
| `DELETE` | `/enrollments/course/:id`      | Remove enrollments by course (inter-service)     |



## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)

### Installation

```bash
git clone https://github.com/reiz-hub/ITSAR2-313-System-Integration-and-Architecture-2.git
cd Microservices
cd student-service && npm install && cd ..
cd course-service && npm install && cd ..
cd enrollment-service && npm install && cd ..
cd api-gateway && npm install && cd ..
```

### Starting All Services

Open **four separate terminals** and run one command in each:

```bash
# Terminal 1 — Student Service
cd student-service && node server.js

# Terminal 2 — Course Service
cd course-service && node server.js

# Terminal 3 — Enrollment Service
cd enrollment-service && node server.js

# Terminal 4 — API Gateway
cd api-gateway && node server.js
```

Or from the root using npm scripts:

```bash
npm run start:student     # Terminal 1
npm run start:course      # Terminal 2
npm run start:enrollment  # Terminal 3
npm run start:gateway     # Terminal 4
```

The app will be available at **http://localhost:3000**.

### Seed Sample Data (Optional)

With all four services running:

```bash
node seed.js
```

This creates:
- **5 students** (Alice Johnson, Bob Smith, Carol Williams, David Brown, Eva Martinez)
- **5 courses** (Introduction to Programming, Data Structures, Web Development, Database Systems, Software Engineering)
- **12 enrollments** across students and courses

---

## Inter-Service Communication

- **Enrollment Service** calls Student and Course services via HTTP to validate data before creating enrollments. If a service is down it returns `503`; if it times out it returns `504`.
- **Student/Course Services** call Enrollment Service via HTTP to cascade-delete enrollments when a student or course is deleted. If the Enrollment Service is unavailable, the delete still succeeds with a `warning` field indicating orphan enrollments may remain.
- Each service can start, stop, and operate independently. If a dependency is down, the service degrades gracefully rather than crashing.


## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, Vanilla JavaScript (Fetch API)
- **Storage:** SQLite via sql.js (one database per service)
- **Communication:** HTTP REST (inter-service)


## LAB 2

## Error Handling

| Code | Meaning               | When It Occurs                                                |
|------|-----------------------|---------------------------------------------------------------|
| 201  | Created               | Student, course, or enrollment created successfully           |
| 400  | Bad Request           | Missing or invalid fields in request body                     |
| 404  | Not Found             | Resource does not exist                                       |
| 409  | Conflict              | Duplicate email or duplicate enrollment                       |
| 503  | Service Unavailable   | A dependent microservice is down                              |
| 504  | Gateway Timeout       | A dependent microservice did not respond within 5 seconds     |



## Testing Documentation

Comprehensive testing documentation is available in the following locations:

### Test Commands
- **`tests/curl-tests.md`** - Complete collection of curl commands for testing all API endpoints including success cases, error cases, and service unavailability scenarios

### Evidence & Reports
- **`docs/report.md`** - Detailed report explaining all implemented edge cases, architectural decisions, and reflections
- **`docs/evidence/01-student-success.txt`** - Student CRUD success responses
- **`docs/evidence/02-student-errors.txt`** - Student error responses (400, 404, 409)
- **`docs/evidence/03-course-success.txt`** - Course CRUD success responses
- **`docs/evidence/04-course-errors.txt`** - Course error responses (400, 404)
- **`docs/evidence/05-enrollment-success.txt`** - Enrollment success responses
- **`docs/evidence/06-enrollment-errors.txt`** - Enrollment error responses (400, 404, 409)
- **`docs/evidence/07-service-unavailable.txt`** - Service unavailability tests (503, 504)

### Quick Test
```bash
# Test all endpoints
curl http://localhost:3000/students
curl http://localhost:3000/courses
curl http://localhost:3000/enrollments

# Test service health
curl http://localhost:3000/api/health
```


