import path from "path";
import express from "express";
import cors from "cors";
import commentRoutes from "./routes/commentRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

const app = express();
const PORT = process.env.PORT || 10000;

const corsOptions = {
  origin: ["https://krobbus.github.io", "http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(quizRoutes);
app.use(commentRoutes);

app.get("/", (_, res) => res.send("AI Backend is Running!"));

app.get("/wake", (_, res) => {
  res.json({ status: "awake", time: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
