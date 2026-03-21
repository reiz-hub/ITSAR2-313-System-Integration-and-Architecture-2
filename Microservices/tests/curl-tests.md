# Curl Test Commands

This document lists all curl commands used to test the Student Course System microservices API.

**Base URL:** `http://localhost:3000` (API Gateway)

---

## Student Endpoints

### Create Student (POST /students)

```bash
# Success - Create new student
curl -i -X POST http://localhost:3000/students ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"John Doe\", \"email\": \"john@example.com\", \"age\": 20}"

# Error - Missing required fields (400)
curl -i -X POST http://localhost:3000/students ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"Jane Doe\"}"

# Error - Duplicate email (409)
curl -i -X POST http://localhost:3000/students ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"John Smith\", \"email\": \"john@example.com\", \"age\": 22}"
```

### Get All Students (GET /students)

```bash
curl -i -X GET http://localhost:3000/students
```

### Get Student by ID (GET /students/:id)

```bash
# Success - Existing student
curl -i -X GET http://localhost:3000/students/1

# Error - Non-existent student (404)
curl -i -X GET http://localhost:3000/students/9999
```

### Update Student (PUT /students/:id)

```bash
# Success - Update existing student
curl -i -X PUT http://localhost:3000/students/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"John Updated\", \"email\": \"john.updated@example.com\", \"age\": 21}"

# Error - Student not found (404)
curl -i -X PUT http://localhost:3000/students/9999 ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"Nobody\", \"email\": \"nobody@example.com\", \"age\": 25}"

# Error - Duplicate email on update (409)
curl -i -X PUT http://localhost:3000/students/2 ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"Test\", \"email\": \"existing@example.com\", \"age\": 22}"
```

### Delete Student (DELETE /students/:id)

```bash
# Success - Delete student (cascades to enrollments)
curl -i -X DELETE http://localhost:3000/students/1

# Error - Student not found (404)
curl -i -X DELETE http://localhost:3000/students/9999
```

---

## Course Endpoints

### Create Course (POST /courses)

```bash
# Success - Create new course
curl -i -X POST http://localhost:3000/courses ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Introduction to Programming\", \"description\": \"Learn basic programming concepts\", \"credits\": 3}"

# Error - Missing required fields (400)
curl -i -X POST http://localhost:3000/courses ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Incomplete Course\"}"
```

### Get All Courses (GET /courses)

```bash
curl -i -X GET http://localhost:3000/courses
```

### Get Course by ID (GET /courses/:id)

```bash
# Success - Existing course
curl -i -X GET http://localhost:3000/courses/1

# Error - Non-existent course (404)
curl -i -X GET http://localhost:3000/courses/9999
```

### Update Course (PUT /courses/:id)

```bash
# Success - Update existing course
curl -i -X PUT http://localhost:3000/courses/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Advanced Programming\", \"description\": \"Updated description\", \"credits\": 4}"

# Error - Course not found (404)
curl -i -X PUT http://localhost:3000/courses/9999 ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Nobody\", \"description\": \"Test description\", \"credits\": 3}"
```

### Delete Course (DELETE /courses/:id)

```bash
# Success - Delete course (cascades to enrollments)
curl -i -X DELETE http://localhost:3000/courses/1

# Error - Course not found (404)
curl -i -X DELETE http://localhost:3000/courses/9999
```

---

## Enrollment Endpoints

### Create Enrollment (POST /enrollments)

```bash
# Success - Enroll student in course
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 1}"

# Error - Missing required fields (400)
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1}"

# Error - Student not found (404)
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 9999, \"courseId\": 1}"

# Error - Course not found (404)
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 9999}"

# Error - Duplicate enrollment (409)
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 1}"
```

### Get All Enrollments (GET /enrollments)

```bash
curl -i -X GET http://localhost:3000/enrollments
```

### Get Enrollments by Student (GET /enrollments/student/:id)

```bash
# Success - Get student's enrollments
curl -i -X GET http://localhost:3000/enrollments/student/1

# Error - Student not found (404)
curl -i -X GET http://localhost:3000/enrollments/student/9999
```

### Delete Enrollments by Student (DELETE /enrollments/student/:id)

```bash
# Inter-service endpoint - removes all enrollments for a student
curl -i -X DELETE http://localhost:3000/enrollments/student/1
```

### Delete Enrollments by Course (DELETE /enrollments/course/:id)

```bash
# Inter-service endpoint - removes all enrollments for a course
curl -i -X DELETE http://localhost:3000/enrollments/course/1
```

---

## Service Unavailability Tests

These tests require stopping specific services to verify error handling.

### Student Service Down (503)

```bash
# Stop student-service, then:
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 1}"
# Expected: 503 SERVICE_UNAVAILABLE
```

### Course Service Down (503)

```bash
# Stop course-service, then:
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 1}"
# Expected: 503 SERVICE_UNAVAILABLE
```

### Gateway Timeout Test (504)

```bash
# Simulate slow response (requires network manipulation or mock):
curl -i -X POST http://localhost:3000/enrollments ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 1}"
# Expected: 504 GATEWAY_TIMEOUT after 5 seconds
```

---

## Verbose Output Commands

Add `-v` flag for verbose output with headers and status codes:

```bash
curl -v -i -X GET http://localhost:3000/students
curl -v -i -X POST http://localhost:3000/students ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"Test User\", \"email\": \"test@example.com\", \"age\": 25}"
```

Add `-w "\n%{http_code}\n"` to display HTTP status code:

```bash
curl -i -s -w "\nHTTP Status: %{http_code}\n" -X GET http://localhost:3000/students/1
```

---

## Sample Test Sequence

Run these commands in order to test the full workflow:

```bash
# 1. Create students
curl -i -X POST http://localhost:3000/students -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"Alice Johnson\", \"email\": \"alice@test.com\", \"age\": 20}"

curl -i -X POST http://localhost:3000/students -H "Content-Type: application/json" ^
  -d "{\"fullName\": \"Bob Smith\", \"email\": \"bob@test.com\", \"age\": 22}"

# 2. Create courses
curl -i -X POST http://localhost:3000/courses -H "Content-Type: application/json" ^
  -d "{\"name\": \"Programming 101\", \"description\": \"Intro to programming\", \"credits\": 3}"

curl -i -X POST http://localhost:3000/courses -H "Content-Type: application/json" ^
  -d "{\"name\": \"Data Structures\", \"description\": \"Learn data structures\", \"credits\": 4}"

# 3. Create enrollments
curl -i -X POST http://localhost:3000/enrollments -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 1}"

curl -i -X POST http://localhost:3000/enrollments -H "Content-Type: application/json" ^
  -d "{\"studentId\": 1, \"courseId\": 2}"

curl -i -X POST http://localhost:3000/enrollments -H "Content-Type: application/json" ^
  -d "{\"studentId\": 2, \"courseId\": 1}"

# 4. View all data
curl -i -X GET http://localhost:3000/students
curl -i -X GET http://localhost:3000/courses
curl -i -X GET http://localhost:3000/enrollments
```
