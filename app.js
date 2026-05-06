  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const dotenv = require('dotenv');
  const path = require('path');
  const http = require('http'); 
  const { Server } = require('socket.io'); 

  const connectDB = require('./app/config/db');

  // Routes
  const UserRoutes = require('./app/router/UserRoutes');
  const NotificationRoutes = require("./app/router/NotificationRoutes");

  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 5000;

  //  Create HTTP server
  const server = http.createServer(app);

  //  Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true
    }
  });

  //  SOCKET CONNECTION
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // Join room (case-based)
    socket.on("join_case", (caseId) => {
      socket.join(caseId);
      console.log(` Joined case room: ${caseId}`);
    });

    // Send message
    socket.on("send_message", (data) => {
      // data = { caseId, message }
      io.to(data.caseId).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  // Connect DB
  connectDB();

  // Middleware
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());

  // Serve uploads
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));

  // Routes
  app.use("/api/v1/users", UserRoutes);
  app.use("/api/v1/notifications", NotificationRoutes);

  app.get('/', (req, res) => {
    res.send('LegalEase+ API is running...');
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: "fail", message: "Something went wrong!" });
  });

  // IMPORTANT: use server.listen (not app.listen)
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });