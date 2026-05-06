# Legalease Backend

Backend API for the Legalease platform.

## Features

- User Authentication (JWT)
- Role-based Access (Admin, Lawyer, Client)
- Case Management
- Notifications System
- Payment Management
- File Uploads using Multer
- Secure API Architecture
- MongoDB Database Integration

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer

## Installation

```bash
npm install

```
Run Server

npm run dev
```

Create a .env file and add:

PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key


Project Structure

Backend
├── app
│   ├── config
│   │   └── db.js
│   │
│   ├── controller
│   │   ├── AnnouncementController.js
│   │   ├── ChatController.js
│   │   ├── ClientController.js
│   │   ├── EventController.js
│   │   ├── LawyerController.js
│   │   ├── NotificationController.js
│   │   └── UserController.js
│   │
│   ├── helper
│   │   ├── EmailHelper.js
│   │   ├── NotificationHelper.js
│   │  └── TokenHelper.js
│   │
│   ├── middleware
│   │   ├── AuthMiddleware.js
│   │   ├── DocUploadMiddleware.js
│   │   └── UploadMiddleware.js
│   │
│   ├── model
│   │   ├── AnnouncementModel.js
│   │   ├── CaseModel.js
│   │   ├── ConsultationRequestModel.js
│   │   ├── EventModel.js
│   │   ├── MessageModel.js
│   │   ├── NotificationModel.js
│   │   └── UserModel.js
│   │
│   └── router
│       ├── NotificationRoutes.js
│       └── UserRoutes.js
│
├── public
├── uploads
│   └── documents
├── views
├── .env
├── .gitignore
├── README.md
├── app.js
├── package.json
├── package-lock.json
└── seed.js

