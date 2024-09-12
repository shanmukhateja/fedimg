import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";
import { renderPageWithUserInfo } from "../utils/render.js";

export const homeRouter = Router();

homeRouter.get('', ensureAuthenticated, async (req, res) => {
    const user = req.user as User;
    const {pageURL, renderPayload} = await renderPageWithUserInfo('home/home.njk', user, req);
    
    res.render(pageURL, renderPayload);
})