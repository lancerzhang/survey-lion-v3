# Survey Lion v3

## 1. System Architecture
Survey Lion v3 follows a modern full-stack architecture:
- **Frontend**: React (SPA) with Tailwind CSS for high-performance, responsive UI.
- **Backend**: Spring Boot 3.2 (REST API) providing robust business logic and data persistence.
- **Database**: H2 (Development) and PostgreSQL (Production).
- **Communication**: JSON over HTTP REST.

## 2. Data Model
- **Survey**: Root entity containing metadata, configuration (lifecycle, privacy, limits), and a list of questions.
- **Question**: Defined by `QuestionType` (Single, Multiple, Rating) with support for logic skipping and optional "Other" fields.
- **SurveyResponse**: Tracks participant answers mapped to question IDs.

## 3. Local Development Setup
1. **Frontend**:
   - Serve the root directory using any static web server (e.g., `npx serve .`).
2. **Backend**:
   - Navigate to `/backend`.
   - Run `mvn spring-boot:run`.
   - Access H2 console at `http://localhost:8080/h2-console`.

## 4. Performance & Load Testing
- **Target**: Average API response time < 0.5s.
- **Optimization**: The system utilizes Hibernate Second-Level Cache for static survey structures and indexed queries for response aggregation.
- **Stress Test**: Use JMeter or k6 to simulate concurrent survey submissions.

## 5. FAQ
- **How to enable multiple submissions?** Navigate to Survey Settings in the Editor and check "Allow Multiple Submissions".
- **Is it truly anonymous?** If "Anonymous" is checked, the backend strips `userId` before persistence.
