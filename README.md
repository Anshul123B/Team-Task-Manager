# 📋 Team Task Manager

A full-stack team productivity app built with the **MERN stack** (MongoDB, Express, React, Node.js), featuring JWT authentication, project management, and a Kanban task board.

---

## 📁 Project Structure

```
Team Task Manager/
├── client/                     # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx  # Drag-free Kanban board with status columns
│   │   │   ├── TaskModal.jsx    # Task creation modal
│   │   │   └── PrivateRoute.jsx # JWT-protected route wrapper
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Signup.jsx       # Signup page
│   │   │   └── Dashboard.jsx    # Main app (projects + board + members)
│   │   ├── utils/
│   │   │   └── api.js           # Centralized API fetch utility
│   │   ├── App.jsx              # React Router setup
│   │   └── main.jsx             # Entry point
│   ├── .env                     # VITE_API_URL
│   └── tailwind.config.js
│
└── server/                      # Node.js + Express backend
    ├── config/
    │   └── db.js                # Mongoose connection
    ├── controllers/
    │   ├── authController.js    # signup, login
    │   ├── projectController.js # CRUD + add member
    │   └── taskController.js    # CRUD + status patch
    ├── middleware/
    │   └── authMiddleware.js    # protect, admin
    ├── models/
    │   ├── User.js              # name, email, password (bcrypt), role
    │   ├── Project.js           # name, description, created_by, members[]
    │   └── Task.js              # title, status, priority, due_date, assigned_to
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── projectRoutes.js
    │   └── taskRoutes.js
    ├── .env                     # PORT, MONGO_URI, JWT_SECRET
    ├── .env.example
    [4;31m[24m    [4;31mserver.js                # Express entry point[24m
```
