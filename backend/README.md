# Restaurant Booking System Backend

## Features

- JWT-based Authentication
- Role-based Authorization (Users & Restaurant Owners)
- Restaurant Management
- Table & Time Slot Management
- Booking System

## Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Authentication:** JWT

## Getting Started

1. **Prerequisites**

   - Python 3.10 or higher
   - PostgreSQL
   - pipenv

2. **Installation**

   ```bash
   # Clone the repository
   git clone <repository-url>

   # Navigate to backend directory
   cd backend

   # Install dependencies
   pipenv install
   ```

3. **Environment Setup**

   Create a `.env` file with the following variables:

   ```
    DATABASE_URL=postgresql://user:password@localhost:5432/db_name
    API_V1_STR=/api/v1
    PROJECT_NAME=project-name
    JWT_SECRET_KEY=your-secret-key
    JWT_ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    REFRESH_TOKEN_EXPIRE_DAYS=7
    BACKEND_CORS_ORIGINS=["http://localhost:3000", ]
   ```

   or just do

   ```
   cp .env.example .env
   ```

4. **Database Setup**

   ```bash
   # Activate virtual environment
   pipenv shell

   # Run migrations
   alembic upgrade head
   ```

5. **Running the Server**

   ```bash
   # Development server
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

1. **Creating New Migrations**

   ```bash
   alembic revision --autogenerate -m "description"

   alembic upgrade head
   ```

2. **Running Tests**

   ```bash
   pytest
   ```
