const app = require("./app");
const { PORT, HOST } = require("./config/constants");
const connectDB = require("./config/db");
const http = require("http");
const socketService = require("./app/services/socketService");

const hostname = HOST || "localhost";
const port = PORT || 5000;

connectDB().then(() => {
  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket service
  socketService.initialize(server);

  // Start server
  server.listen(PORT, () => {
    console.log(`Server running at http://${hostname}:${port}`);
    console.log(`WebSocket server initialized`);
  });
});
