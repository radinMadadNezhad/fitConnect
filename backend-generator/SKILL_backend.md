---
name: backend-generator
description: Generates and tests a complete backend for a given web design. Use when the user provides a design (HTML/CSS/Image/Description) and wants a functional API with database. 
---

# Backend Generator Skill

This skill guides you through creating a fully functional backend (Node.js/Express/SQLite) to match a provided web design.

## Workflow

### Phase 1: Analyze & Plan

1.  **Analyze the Design**: Look at the provided design (image, HTML, or description). Identify:
    *   **Data Entities**: What "things" are being displayed? (e.g., Products, Users, Posts, Comments).
    *   **Relationships**: How do they relate? (e.g., A User has many Posts).
    *   **Fields**: What attributes does each entity have? (e.g., Title, Price, ImageURL).
    *   **Actions**: What can the user do? (e.g., Create Post, Delete Comment, Buy Product).

2.  **Define Schema**: proposing a database schema (tables/columns).

3.  **Define API Endpoints**: specific CRUD routes needed to power the UI.

### Phase 2: Project Setup

1.  **Initialize Project**:
    *   Create a `backend` directory.
    *   Run `npm init -y`.
    *   Install dependencies: `npm install express sqlite3 sequelize cors body-parser`.
    *   Install dev dependencies: `npm install --save-dev nodemon jest supertest`.

2.  **Project Structure**:
    ```
    backend/
      ├── server.js
      ├── models/
      ├── routes/
      ├── controllers/
      ├── database/
      │   └── database.sqlite
      └── tests/
    ```

### Phase 3: Implementation

1.  **Database Setup**:
    *   Initialize Sequelize or raw SQLite connection.
    *   Create models/tables based on the schema from Phase 1.
    *   **Important**: Include a seed script to populate the database with dummy data matching the design, so the UI isn't empty.

2.  **API Implementation**:
    *   Create `server.js` to set up Express, Middleware (CORS, BodyParser), and Routes.
    *   Implement Controllers for each entity (GET, POST, PUT, DELETE).
    *   Ensure error handling is present.

### Phase 4: Verification & Testing

1.  **Generate Tests**:
    *   Create `tests/api.test.js`.
    *   Write integration tests using `supertest` to verify:
        *   GET returns 200 and correct data structure.
        *   POST creates data and returns 201.
        *   Error cases (404, 400).

2.  **Run Tests**:
    *   Execute `npm test`.
    *   If tests fail, debug and fix the code immediately.

3.  **Final Verification**: 
    *   Start the server (`node server.js`).
    *   Confirm it is running on the specified port (default 3000).

## Best Practices

*   **Keep it Simple**: Use SQLite for zero-config persistence.
*   **Seed Data**: Always provide seed data so the frontend has something to show immediately.
*   **CORS**: Enable CORS so the frontend can actually call the API.
*   **Error Messages**: Return JSON error messages `{ "error": "message" }`, not HTML stack traces.
