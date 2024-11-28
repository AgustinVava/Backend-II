import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import { Server } from "socket.io";
import { connectMongoDB } from "./config/mongoDB.config.js";
import { initializePassport } from "./config/passpot.config.js";
import routes from "./routes/index.js";

const app = express();

connectMongoDB();
initializePassport();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
app.use(
  session({
    secret: "secret",
    resave: true, // Mantiene la session activa, si es false, se cierra
    saveUninitialized: true, // Guarde la session
  })
);
app.use(cookieParser("secretKey"));
// Rutes - api
app.use("/api", routes);

const httpServer = app.listen(8080, () => {
  console.log("Servidor escuchando en el puerto 8080");
});

// Configuration - socket
export const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("Nuevo usuario Conectado");
});
