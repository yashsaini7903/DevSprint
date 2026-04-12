const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const path = require("path");   
dotenv.config({ path: path.join(__dirname, ".env") });
require("./config/db");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const {Server, Socket} = require("socket.io");
const handleConnection = require("./controllers/SocketControllers");

const userRoutes = require("./routes/userRoute");   
const postRoutes = require("./routes/postRoute");
const liveRoutes = require("./routes/liveRoutes")

const app = express();


const port = process.env.PORT || 3000;
app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(bodyParser.json());


app.use('/api/user',userRoutes);
app.use('/api/post',postRoutes);
app.use('/api/live',liveRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
    });
}

io.on("connection", (socket) => handleConnection(socket, io));

server.listen(port, () => console.log(`Server running on port ${port}`));
