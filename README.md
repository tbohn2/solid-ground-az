# Solid Ground AZ

## Overview
Solid Ground AZ's **Stretch Scheduler** is a full-stack web application designed to manage yoga instructor schedules, clients, and appointments. Built using **ASP.NET Core** with **Razor Pages** and **MySQL**, this application provides a responsive and efficient solution for scheduling management.

## URL
Visit [here](https://solidgroundaz.com) to view the site.

Visit [here](https://solidgroundaz.com/admin) to explore admin site.
### Credentials:
- Username: test
- Password: testtest

## Features
- **User Authentication**: Secure login and authentication using JWT (JSON Web Tokens).
- **Schedule Management**: Yoga instructors can edit their schedule, view client appointments, and make updates in real-time.
- **Client Booking**: Clients can browse available slots and book appointments.
- **Admin Dashboard**: Admin users have access to an additional dashboard for managing schedules and appointments.
- **Dynamic Frontend**: Frontend developed with **jQuery** to provide interactive user experiences.

## Technologies
### Backend
- **ASP.NET Core 8.0**: Framework for building the web application.
- **Razor Pages**: Simplified page-centric programming model.
- **MySQL**: Database management for storing schedules, appointments, and user data.
- **Entity Framework Core**: Object-Relational Mapping (ORM) for database interactions.
- **Pomelo.EntityFrameworkCore.MySql**: MySQL provider for EF Core.

### Frontend
- **jQuery**: JavaScript library for handling dynamic content and user interactions.

### Security
- **BCrypt.Net-Next**: Password hashing for secure user authentication.
- **JWT Bearer Authentication**: Secure API access with tokens.

### Dependencies
- BCrypt.Net-Next (4.0.3)
- dotenv.net (3.1.3)
- Microsoft.AspNetCore.Authentication.JwtBearer (8.0.4)
- Microsoft.EntityFrameworkCore (8.0.3)
- Microsoft.EntityFrameworkCore.Design (8.0.3)
- Microsoft.EntityFrameworkCore.Tools (8.0.3)
- Newtonsoft.Json (13.0.3)
- Pomelo.EntityFrameworkCore.MySql (8.0.2)

## Contact

For any questions or support, please contact tanner.bohn@gmail.com.

## Screenshot

![solidgroundaz com_](https://github.com/user-attachments/assets/da699142-8989-40c7-9be5-62a41f4f908c)
 
## Deploying to Render with Docker

1. Ensure the provided `Dockerfile` and `.dockerignore` exist at the repository root.
2. Commit and push your changes to your default branch (e.g., `main`).
3. In Render, click New → Web Service and connect this repository.
   - Environment: Docker
   - Render will detect `Dockerfile` automatically (or you can keep `render.yaml` in the repo).
   - No need to set a port; the container listens on `8080` via `ASPNETCORE_URLS`.
4. Add environment variables in Render:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - Any required secrets (DB connection string, JWT settings, encryption keys, email creds, etc.). Do not commit secrets.
5. Deploy. Render builds the image and runs the container. Health check defaults to `/`.

Optional: `render.yaml` in the repo root allows infra-as-code provisioning on Render.