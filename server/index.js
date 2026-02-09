const fs = require("fs");
const https = require("https");
const { Server } = require("socket.io");

const options = {
  key: fs.readFileSync("./192.168.1.19+2-key.pem"),
  cert: fs.readFileSync("./192.168.1.19+2.pem"),
};

const httpsServer = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end("Server is running");
});


const io = new Server(httpsServer, {
  cors: {
    origin: "*",
  },
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id });
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

httpsServer.listen(8000, "0.0.0.0", () => {
  console.log("Secure Socket running on https://192.168.1.19:8000");
});
