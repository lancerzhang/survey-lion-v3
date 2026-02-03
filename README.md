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
- **PostgreSQL (Docker + dev profile)**:
  1. Start a local Postgres container:
      ```bash
      docker run --name surveylion-pg \
        -e POSTGRES_DB=surveylion \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -p 5432:5432 \
        -v surveylion_pg:/var/lib/postgresql/data \
        -d postgres:16
      ```
  2. Run Spring Boot with the `dev` profile:
      ```bash
      cd backend
      SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
      ```
      Or:
      ```bash
      mvn spring-boot:run -Dspring-boot.run.profiles=dev
      ```
      Profile config lives in `backend/src/main/resources/application-dev.properties`.
      If you prefer env overrides, also set `SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver`.
  3. Seed performance data:
      ```bash
      docker exec -i surveylion-pg psql -U postgres -d surveylion < backend/scripts/seed_perf.sql
      ```
      *Note: the seed script truncates the survey tables before inserting data.*

## Performance Seed (PostgreSQL)
The performance seed script lives at `backend/scripts/seed_perf.sql`. It truncates
survey tables and generates ~5000 users, 2-4 surveys per user, 4-6 questions per
survey, and 8-12 responses per survey. It also creates the schema if the tables
do not exist yet.

Usage (PostgreSQL):
```bash
# 1) Point Spring to PostgreSQL (update backend/src/main/resources/application.properties)
# 2) Run the seed (pgcrypto is created automatically)
psql -d <your_db_name> -f backend/scripts/seed_perf.sql
```

## Key API Routes
- `GET /api/surveys` (paged; filters: `ownerId/ownerIds`, `status/statuses`, `ids`)
- `GET /api/surveys/{id}`
- `POST /api/surveys`
- `DELETE /api/surveys/{id}`
- `GET /api/responses` (paged)
- `POST /api/responses`
- `GET /api/responses/{id}`
- `GET /api/responses/survey/{surveyId}` (paged, `includeAnswers=true|false`)
- `GET /api/responses/survey/{surveyId}/user/{userId}`
- `GET /api/responses/user/{userId}` (paged, `includeAnswers=true|false`)
- `GET /api/responses/count?surveyId=...` or `...count?surveyIds=...`

Paged endpoints accept `page` and `size` query params and return Spring `Page` JSON (`content`, `totalElements`, `totalPages`, etc).
