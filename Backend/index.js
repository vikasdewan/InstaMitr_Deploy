import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import { app , server } from "./socket/socket.js";
import path from "path";



dotenv.config({});

const __dirname = path.resolve(); //to get the current directory

 

const port = process.env.PORT || 3000;

// app.get("/", (req, res) => {
//   return res.status(200).json({
//     message: "i am coming from backend",
//     success: true,
//   });
// });

//middleware

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));



//yaha par api  call karna hai
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);
 
app.use(express.static(path.join(__dirname,"/Frontend/dist"))) //dist folder ko static file ke roop me serve karna hai jo ki frontend me hai  // run command : npm run build

app.get("*",(req,res)=>{ // other than the above routes , this route will be executed routes present in frontend
  res.sendFile(path.resolve(__dirname,"Frontend","dist","index.html"));
})
 



server.listen(port, () => {
  connectDB();
  console.log(`server listening at port : ${port}`);
});
