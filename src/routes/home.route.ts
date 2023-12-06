import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";

export const homeRouter = Router();

homeRouter.get('', ensureAuthenticated, async (req, res) => {
    // FIXME: use renderProfilePage
    const user = req.user as User;
    res.render('home/home.njk', {
        userName: user.displayName,
        userEmail: user.email
    })
})