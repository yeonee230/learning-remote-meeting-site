import express from "express";

import { login } from "../controllers/userController";

const globalRouter = express.Router();

const handleHome = (req, res) => res.send("Home");


globalRouter.get("/", handleHome);
globalRouter.get("/login", login);


export default globalRouter;
