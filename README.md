# Survey Lion v3

A lightweight survey creation and response platform.

## Project Structure

This is a full stack application consisting of:

1. **Frontend**: React + TypeScript + Vite (`/frontend`)
2. **Backend**: Spring Boot 3.2 + JDK 21 (`/backend`)

## Running the Frontend (Client)

```bash
cd frontend
npm install
npm run dev
```

Note: The frontend calls the real backend at `http://localhost:8080/api` and falls
back to localStorage if the backend is unreachable or returns a non-2xx error.
This fallback behavior lives in `frontend/services/storageService.ts`.

## Running the Backend (Server)

### Prerequisites
- JDK 21
- Maven

### Setup

```bash
cd backend
mvn spring-boot:run
```

The server starts at `http://localhost:8080`.

## Database
- **Development**: H2 in-memory database
- **Console**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:mem:surveydb`

## Key API Routes
- `GET /api/surveys`
- `GET /api/surveys/{id}`
- `POST /api/surveys`
- `DELETE /api/surveys/{id}`
- `GET /api/responses`
- `POST /api/responses`
- `GET /api/responses/survey/{surveyId}`
- `GET /api/responses/user/{userId}`
