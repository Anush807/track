import express, {Request, Response} from "express";
import authRoute from "./routes/authRoute"
import todoRoute from "./routes/todoRoute";

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.use("/", authRoute);
app.use("/todos", todoRoute);

app.listen(port, () => {
    console.log("server running on port " + port);
})

