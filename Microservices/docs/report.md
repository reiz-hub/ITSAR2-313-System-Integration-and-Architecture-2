# Implementation Report

**Project:** Student Course System - Microservices Architecture
**Course:** ITSAR2 313 - System Integration and Architecture 2

---

## Overview

This report documents the edge cases implemented in the Student Course System microservices application and provides reflections on the architectural decisions made.

---

## Abstract

This report documents the edge cases implemented and validated in the Student Course System built in Lab 1. The system consists of three independent Node.js/Express services — Student Service (port 3001), Course Service (port 3002), and Enrollment Service (port 3003) — each backed by its own SQLite database, communicating over HTTP through an API Gateway at port 3000. The objective was to verify that each service correctly handles the five required distributed system failure modes: validation failures (400), missing resources (404), duplicate conflicts (409), dependency outages (503), and network timeouts (504). All edge cases were tested using curl with the -i flag, and each output was saved to docs/evidence/ as a .txt file. Testing confirmed that every required status code was correctly triggered and returned in the standard `{ "error": "STATUS_CODE TYPE", "message": "..." }` JSON shape consistently across all services.

---

## Introduction

Microservices architecture decomposes a system into small, independently deployable services that each own a specific domain and communicate over the network. Unlike a monolithic application where function calls between modules are synchronous and always succeed or fail atomically, microservices introduce partial failure — a condition where one service may be healthy while another is down, slow, or returning unexpected results.

This report required implementing and validating five categories of failure handling that are fundamental to any production-grade distributed system:

- **Input Validation (HTTP 400 Bad Request)** — clients may submit empty, incomplete, or structurally invalid request bodies. Without server-side validation, bad data enters the SQLite database and corrupts downstream operations.
- **Resource Not Found (HTTP 404 Not Found)** — REST APIs address resources by ID. When a requested record does not exist, the server must distinguish this from a successful empty result. In the Enrollment Service, this also applies cross-service: if Student or Course Service reports a missing record, the Enrollment Service surfaces a 404 rather than writing an orphan row.
- **Duplicate Resource Conflict (HTTP 409 Conflict)** — enrollment creation is non-idempotent. A second request to enroll the same student in the same course should be rejected with 409, not silently duplicated. The Student Service also returns 409 on duplicate email.
- **Dependency Unavailable (HTTP 503 Service Unavailable)** — the Enrollment Service depends on Student Service and Course Service to validate entities before writing. If either is stopped, the TCP connection is refused and the Enrollment Service must surface a 503 rather than crashing with an unhandled exception.
- **Dependency Timeout (HTTP 504 Gateway Timeout)** — a service that is slow rather than down creates a different failure mode. Without a timeout, the Enrollment Service's Node.js event loop blocks, eventually becoming unresponsive to all concurrent requests. The 5-second AbortController timeout converts an unbounded wait into a controlled 504 response.

---

## Implemented Edge Cases

### 1. Input Validation (400 Bad Request)

**Student Service** — missing `fullName`, `email`, or `age` when creating a student. All three fields are required. The controller collects all failing fields into a `details` array and returns a single 400 response so the client receives complete feedback in one round trip.

**Course Service** — missing `name`, `description`, or `credits` when creating a course. All three fields are required for successful creation.

**Enrollment Service** — missing `studentId` or `courseId` when creating an enrollment. Both fields are required. Validation runs before any inter-service HTTP call is made, so obviously invalid requests never hit the downstream services.

### 2. Resource Not Found (404 Not Found)

**Student Service:**
- `GET /students/:id` — returns 404 when the student ID does not exist in students.sqlite
- `PUT /students/:id` — returns 404 when trying to update a non-existent student
- `DELETE /students/:id` — returns 404 when trying to delete a non-existent student

**Course Service:**
- `GET /courses/:id` — returns 404 when the course ID does not exist in courses.sqlite
- `PUT /courses/:id` — returns 404 when trying to update a non-existent course
- `DELETE /courses/:id` — returns 404 when trying to delete a non-existent course

**Enrollment Service:**
- `POST /enrollments` — returns 404 when `studentId` does not exist in Student Service (cross-service check via HTTP)
- `POST /enrollments` — returns 404 when `courseId` does not exist in Course Service (cross-service check via HTTP)
- `GET /enrollments/student/:id` — returns 404 when the student does not exist

### 3. Conflict Detection (409 Conflict)

**Student Service:**
- Create: duplicate email detection — prevents creating students with an email already in students.sqlite
- Update: duplicate email detection — prevents changing a student's email to one that already belongs to another student

**Enrollment Service:**
- Duplicate enrollment detection — prevents enrolling the same student in the same course twice. Enforced both by a controller-level check and a `UNIQUE(studentId, courseId)` constraint in enrollments.sqlite.

### 4. Service Unavailability (503 Service Unavailable)

**Enrollment Service:**
- Returns 503 when Student Service is stopped and enrollment creation is attempted
- Returns 503 when Course Service is stopped (Student Service still running) and enrollment creation is attempted
- Returns 503 when Student Service is stopped and `GET /enrollments/student/:id` is called

When one service is down, all other service endpoints remain fully functional — stopping Student Service does not affect `GET /courses` or any Course Service operation, confirming service isolation.

### 5. Gateway Timeout (504 Gateway Timeout)

**Enrollment Service:**
- Returns 504 when Student Service does not respond within 5 seconds
- Returns 504 when Course Service does not respond within 5 seconds
- Implemented using `AbortController` with a 5-second timeout on all inter-service fetch calls

To trigger this in testing, a `GET /slow-test` route was added to Student Service that sleeps for 10 seconds — longer than the 5-second threshold — without modifying any production code paths.

### 6. Cascade Deletion

**Student Service** — when a student is deleted, the service sends `DELETE /enrollments/student/:id` to the Enrollment Service to remove all associated enrollment records. Deletion succeeds even if the Enrollment Service is unavailable (graceful degradation), with a `warning` field in the response noting that orphan records may remain.

**Course Service** — when a course is deleted, the service sends `DELETE /enrollments/course/:id` to the Enrollment Service. Same graceful degradation behavior applies.

---

## Architectural Decisions

### Database Per Service

Each microservice maintains its own isolated SQLite database file:

- `students.sqlite` — Student Service
- `courses.sqlite` — Course Service
- `enrollments.sqlite` — Enrollment Service

All tables use `INTEGER PRIMARY KEY AUTOINCREMENT` for IDs. Integer IDs provide better performance and simpler URL routing compared to UUIDs, and each service independently manages its own ID sequence. The enrollments table enforces a `UNIQUE(studentId, courseId)` constraint at the database level as a second layer of protection after the controller-level duplicate check.

This design ensures loose coupling between services. Each service can evolve its schema independently — adding columns, changing constraints, or migrating to a different storage engine — without affecting the others, as long as its HTTP API contract remains stable.

### HTTP-Based Inter-Service Communication

Services communicate exclusively via HTTP REST calls rather than shared databases or message queues. This is the simplest inter-service communication model and the most transparent for a learning context — every interaction between services is a visible HTTP request that can be inspected, replayed, and tested independently with curl.

The tradeoff is synchronous coupling: the Enrollment Service's create path cannot succeed if Student Service or Course Service is unreachable. This is addressed through 503/504 error handling rather than asynchronous decoupling, which would require a message broker and significantly more infrastructure.

### API Gateway Pattern

All external traffic flows through the API Gateway on port 3000, which reverse-proxies requests to the appropriate downstream service and serves the static frontend at `public/index.html`. This provides a single entry point for clients, centralizes routing logic, and creates a natural boundary for future cross-cutting concerns such as rate limiting, authentication, or request logging — without any service needing to implement those concerns individually.

### Graceful Degradation

When a dependent service is unavailable, the system prioritizes availability of core operations over strict consistency:

- Enrollment creation fails with 503/504 (correct — it cannot create a valid enrollment without verifying the student and course exist)
- Student/Course deletion succeeds with a `warning` field noting potential orphan enrollment records (acceptable — the primary record is gone; cleanup of references can be retried or handled later)

This asymmetry is intentional: a failed enrollment creation has no side effects, but blocking a student or course deletion on an unavailable Enrollment Service would hold core operations hostage to a non-core dependency.

---

## Reflections

### Challenges Faced

**Managing inter-service dependencies** — ensuring the Enrollment Service properly validates against both Student and Course Services before creating records required careful error handling for multiple independent failure modes: either service could be down, either could return 404, or either could time out. Each combination needed a distinct, correctly-labelled response.

**Timeout handling** — implementing the AbortController correctly required understanding the difference between `AbortError` (timeout fired) and a generic network error (connection refused). Collapsing both into the same catch block without inspecting `err.name` would have returned 503 for timeouts and 504 for outages — exactly backwards from the correct semantics.

**Cascade operations** — coordinating deletions across services while handling the case where the Enrollment Service might be down required the cascade caller to treat the inter-service DELETE as advisory rather than blocking. Getting this right without accidentally swallowing genuine errors required careful response inspection.

### Lessons Learned

**Error handling is the architecture** — in a monolith, an unhandled exception crashes one process and the developer sees it immediately. In microservices, an unhandled inter-service error silently becomes a 500 response to the caller, who has no way to distinguish it from a server bug. Comprehensive error handling for timeouts, refusals, and unexpected status codes is not a polish step — it is part of the core design.

**Idempotency matters** — the cascade deletion endpoints (`DELETE /enrollments/student/:id` and `DELETE /enrollments/course/:id`) were designed to be safely retryable. Calling them on an already-empty student or course returns a success response with `removedCount: 0` rather than a 404, because the desired end state (no enrollments for that ID) has been achieved regardless of whether any rows existed.

**Consistency trade-offs are explicit decisions** — the system accepts eventual consistency for cascade deletions in exchange for better availability of core CRUD operations. This is a deliberate trade-off, not an oversight. Making it explicit — documenting the `warning` field and its meaning — ensures that any future developer or client knows exactly what to expect and can implement their own compensating logic if strict consistency is required.

### Future Improvements

- **Message Queue Integration** — replace synchronous cascade deletion calls with asynchronous messaging (e.g., RabbitMQ or a simple event queue) so that enrollment cleanup is guaranteed eventually even if the Enrollment Service is temporarily down.
- **Circuit Breaker Pattern** — prevent repeated calls to a known-down service during an outage window. Instead of hitting a refused connection on every request, a circuit breaker opens after a threshold of failures and returns 503 immediately until the service recovers.
- **Distributed Tracing** — add a correlation ID header (e.g., `X-Request-ID`) that propagates through all inter-service calls, making it possible to reconstruct the full request chain across service logs during debugging.
- **Health Check Endpoints** — add `GET /health` to each service returning the service name, status, and database reachability. The API Gateway could aggregate these into a single system health response.
- **Retry Logic** — implement exponential backoff retry for transient inter-service failures, distinguishing retriable errors (503, 504, network blips) from non-retriable ones (400, 404, 409).

---

## Conclusion

This project demonstrates the fundamental concepts of microservices architecture — service isolation, HTTP-based inter-service communication, and distributed system error handling — by implementing them in a concrete, testable system. The five edge case categories (400, 404, 409, 503, 504) cover the minimum failure surface that any service operating in a distributed environment must address. The graceful degradation approach — failing fast on writes, succeeding with warnings on deletes — ensures the system remains partially functional during partial outages rather than becoming completely unavailable when any one dependency goes down.

The most significant lesson is that microservices do not make error handling easier; they make it unavoidable. In a monolith, a function call either returns or throws, and the failure is local. In a microservices system, every inter-service call is a network operation that can fail in multiple independent ways — and the calling service is responsible for handling every one of them explicitly, or surfacing a controlled failure to its own callers. Building that discipline into the Enrollment Service's inter-service calls was the core engineering challenge of this lab, and the resulting code is more robust precisely because those failure modes were confronted directly rather than left to default error handlers.
