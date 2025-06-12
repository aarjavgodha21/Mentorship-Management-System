# Mentorship Management Platform

A full-stack web application for connecting mentors and mentees, built with React, Node.js, and MySQL.

## Features

- User authentication (Mentor/Mentee roles)
- Profile management
- Advanced search and matchmaking
- Mentorship request system
- Session scheduling
- Real-time notifications

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL
- **Authentication**: JWT
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up the database:
   - Create a MySQL database named `mentorship_db`
   - Import the schema from `backend/database/schema.sql`

4. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

5. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd ../frontend
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## Project Structure

```
mentorship-platform/
├── frontend/           # React frontend application
├── backend/           # Node.js backend server
└── database/          # Database schema and migrations
```

## API Documentation

The API documentation is available at `/api-docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 