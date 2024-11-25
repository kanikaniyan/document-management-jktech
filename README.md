# NestJS Application Documentation

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
  - [Running Tests](#running-tests)
- [Folder Structure](#folder-structure)
- [Available Endpoints](#available-endpoints)
- [Environment Variables](#environment-variables)

---

## Introduction

This NestJS application is a robust, scalable, and modular solution designed to meet modern web application requirements. It supports secure authentication, role-based authorization, and CRUD operations while seamlessly integrating with a relational database. Additionally, the application includes a document management module, enabling efficient ingestion, processing, and management of documents. This module supports automated workflows, reprocessing of failed ingestion tasks, and ensures a streamlined approach to handling document-related operations.

---

## Features

- RESTful API architecture
- Role-based access control (RBAC)
- JWT Authentication
- Data persistence using TypeORM
- E2E and Unit testing with Jest
- Built-in validation and error handling
- Modular architecture for scalability
- Swagger documentation for API endpoints

---

## Technologies Used

- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL (default)
- **ORM:** TypeORM
- **Authentication:** JWT
- **Testing:** Jest and Supertest
- **Documentation:** Swagger

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL

---

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kanikaniyan/document-management-jktech.git
   cd document-management-jktech
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your database credentials and other configurations.

---

### Running the Application

1. Start the application in development mode:
   ```bash
   npm run start:dev
   ```

2. Access the application at `http://localhost:3000`.

3. View Swagger API documentation at `http://localhost:3000/api`.

---

### Running Tests

- Run unit tests:
  ```bash
  npm run test
  ```

- Run E2E tests:
  ```bash
  npm run test:e2e
  ```

- Check test coverage:
  ```bash
  npm run test:cov
  ```

---

## Folder Structure

```bash
src/
├── auth/             # Authentication and authorization
├── documents/        # Documents module
├── ingestion/        # Ingestion module
├── user/             # User module
├── app.module.ts     # Root application module
├── main.ts           # Application entry point
test/
├── e2e/              # End-to-end tests
├── unit/             # Unit tests
```

---

## Available Endpoints

### Authentication
| Method | Endpoint       | Description                        |
|--------|----------------|------------------------------------|
| POST   | `/auth/login`  | User login                         |
| GET    | `/auth/profile`| Get User profile once logged in.   |

### User Management
| Method | Endpoint          | Description           |
|--------|-------------------|-----------------------|
| POST   | `/user`          | Create a new user     |
| GET    | `/user`          | Get all users         |
| GET    | `/user/:id`      | Get user by ID        |
| PATCH  | `/user/:id`      | Update user by ID     |
| DELETE | `/user/:id`      | Delete user by ID     |

### Documents
| Method | Endpoint          | Description           |
|--------|-------------------|-----------------------|
| POST   | `/documents`      | Create a new doucment     |
| GET    | `/documents`      | Get all Documents         |
| GET    | `/documents/:id`       | Get document by ID        |
| PATCH  | `/documents/:id`       | Update document by ID     |

### Ingestion
| Method | Endpoint                   | Description                     |
|--------|----------------------------|---------------------------------|
| POST   | `/ingestion`               | Trigger ingestion process       |
| GET    | `/ingestion`               | Get all ingestion processes     |
| GET    | `/ingestion/:id`           | Get ingestion process by ID     |
| POST   | `/ingestion/reprocess-failed` | Reprocess failed ingestions  |

---

## Environment Variables

| Variable            | Description                             |
|---------------------|-----------------------------------------|
| `DB_HOST`     | Database host                          |
| `DB_PORT`     | Database port                          |
| `DB_USERNAME`     | Database username                      |
| `DB_PASSWORD` | Database password                      |
| `DB_NAME`     | Name of the database                   |
| `JWT_SECRET`        | Secret key for JWT                     |
| `JWT_EXPIRATION`    | Token expiration time                  |
| `PYTHON_SERVICE_URL`          | Python Service URL for ingestion     |

---