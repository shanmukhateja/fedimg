import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";
import { UserController } from "../controllers/user.controller.js";

export const homeRouter = Router();

homeRouter.get('', ensureAuthenticated, async (req, res) => {
    const user = req.user as User;
    UserController.renderPageWithUserInfo('home/home.njk', user, res);
})