# Implementation Report

**Project:** Student Course System - Microservices Architecture
**Course:** ITSAR2 313 - System Integration and Architecture 2

---

## Overview

This report documents the edge cases implemented in the Student Course System microservices application and provides reflections on the architectural decisions made.

---

## Implemented Edge Cases

### 1. Input Validation (400 Bad Request)

**Student Service:**
- Missing `fullName`, `email`, or `age` when creating a student
- All three fields are required for successful creation

**Course Service:**
- Missing `name`, `description`, or `credits` when creating a course
- All three fields are required for successful creation

**Enrollment Service:**
- Missing `studentId` or `courseId` when creating an enrollment
- Both fields are required for successful enrollment

### 2. Resource Not Found (404 Not Found)

**Student Service:**
- GET `/students/:id` - Returns 404 when student ID doesn't exist
- PUT `/students/:id` - Returns 404 when trying to update non-existent student
- DELETE `/students/:id` - Returns 404 when trying to delete non-existent student

**Course Service:**
- GET `/courses/:id` - Returns 404 when course ID doesn't exist
- PUT `/courses/:id` - Returns 404 when trying to update non-existent course
- DELETE `/courses/:id` - Returns 404 when trying to delete non-existent course

**Enrollment Service:**
- POST `/enrollments` - Returns 404 when studentId doesn't exist in Student Service
- POST `/enrollments` - Returns 404 when courseId doesn't exist in Course Service
- GET `/enrollments/student/:id` - Returns 404 when student doesn't exist

### 3. Conflict Detection (409 Conflict)

**Student Service:**
- CREATE: Duplicate email detection - prevents creating students with existing emails
- UPDATE: Duplicate email detection - prevents updating to an email that belongs to another student

**Enrollment Service:**
- Duplicate enrollment detection - prevents enrolling the same student in the same course twice

### 4. Service Unavailability (503 Service Unavailable)

**Enrollment Service:**
- Returns 503 when Student Service is down during enrollment creation
- Returns 503 when Course Service is down during enrollment creation
- Returns 503 when Student Service is down during enrollment lookup by student

### 5. Gateway Timeout (504 Gateway Timeout)

**Enrollment Service:**
- Returns 504 when Student Service doesn't respond within 5 seconds
- Returns 504 when Course Service doesn't respond within 5 seconds
- Implemented using `AbortController` with a 5-second timeout

### 6. Cascade Deletion

**Student Service:**
- When a student is deleted, sends HTTP DELETE to Enrollment Service to remove all of that student's enrollments
- Deletion succeeds even if Enrollment Service is unavailable (graceful degradation)

**Course Service:**
- When a course is deleted, sends HTTP DELETE to Enrollment Service to remove all enrollments for that course
- Deletion succeeds even if Enrollment Service is unavailable (graceful degradation)

---

## Architectural Decisions

### Database Per Service

Each microservice maintains its own SQLite database:
- `students.sqlite` - Student Service
- `courses.sqlite` - Course Service
- `enrollments.sqlite` - Enrollment Service

**Schema Design:**
- All tables use `INTEGER PRIMARY KEY AUTOINCREMENT` for IDs
- Integer IDs provide better performance and simpler URL routing compared to UUIDs
- Each service independently manages its own ID sequence
- Enrollments table uses `UNIQUE(studentId, courseId)` constraint to prevent duplicate enrollments

**Rationale:** This ensures loose coupling between services. Each service can evolve its schema independently without affecting others.

### HTTP-Based Inter-Service Communication

Services communicate exclusively via HTTP REST calls rather than shared databases or message queues.

**Rationale:**
- Simpler implementation for a learning project
- Easy to test and debug
- Clear service boundaries

### API Gateway Pattern

All external traffic flows through the API Gateway on port 3000, which proxies requests to the appropriate service.

**Rationale:**
- Single entry point for clients
- Centralized routing logic
- Serves static frontend assets
- Potential for future cross-cutting concerns (rate limiting, auth)

### Graceful Degradation

When a dependent service is unavailable:
- Enrollment creation fails with appropriate error codes (503/504)
- Student/Course deletion succeeds with a warning about potential orphan records

**Rationale:** Prioritizes data consistency for writes while allowing core operations to complete even during partial failures.

---

## Reflections

### Challenges Faced

1. **Managing Inter-Service Dependencies:** Ensuring the Enrollment Service properly validates against both Student and Course services before creating records required careful error handling for multiple failure modes.

2. **Timeout Handling:** Implementing proper timeout behavior using `AbortController` to prevent requests from hanging indefinitely when services are slow or unresponsive.

3. **Cascade Operations:** Coordinating deletions across services while handling cases where dependent services might be unavailable.

### Lessons Learned

1. **Error Handling is Critical:** In a microservices architecture, network failures are common. Comprehensive error handling for timeouts, unavailability, and unexpected responses is essential.

2. **Idempotency Matters:** The cascade deletion endpoints (`/enrollments/student/:id` and `/enrollments/course/:id`) are designed to be safely retryable.

3. **Consistency Trade-offs:** The system accepts eventual consistency for cascade deletions in exchange for better availability of core CRUD operations.

### Future Improvements

1. **Message Queue Integration:** Replace synchronous HTTP calls with asynchronous messaging (e.g., RabbitMQ) for cascade operations to improve reliability.

2. **Circuit Breaker Pattern:** Implement circuit breakers to prevent cascading failures when services are unhealthy.

3. **Distributed Tracing:** Add request tracing across services for better debugging and monitoring.

4. **Health Checks:** Add health check endpoints to each service for better observability.

5. **Retry Logic:** Implement exponential backoff retry for transient failures in inter-service calls.

---

## Conclusion

This project demonstrates the fundamental concepts of microservices architecture including service isolation, inter-service communication, and distributed system error handling. The implemented edge cases cover common scenarios in distributed systems while the graceful degradation approach ensures the system remains partially functional even during partial outages.
