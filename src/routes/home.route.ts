import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";
import { renderPageWithUserInfo } from "../utils/render.js";

export const homeRouter = Router();

homeRouter.get('', ensureAuthenticated, async (req, res) => {
    const user = req.user as User;
    renderPageWithUserInfo('home/home.njk', user, res);
})