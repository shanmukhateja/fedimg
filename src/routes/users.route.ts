import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";
import { renderPageWithUserInfo } from "../utils/render.js";

const userRouter = Router();

userRouter.get('/profile', ensureAuthenticated, async (req, res) => {
    renderPageWithUserInfo('home/profile.njk', req.user as User, res);
})

userRouter.get('/:usernameOrEmail', UserController.handleUserByNameOrEmail);

userRouter.post('/profile/update-name', ensureAuthenticated, async (req, res) => {
    const { displayName, email } = req.body;
    if (!displayName) {
        res.sendStatus(400)
        return;
    }

    const loggedInUser = req.user as User;

    if (email != loggedInUser.email) {
        res.sendStatus(400);
        return;
    }

    const isUpdated = await UserController.updateDisplayName(loggedInUser.preferredUsername, displayName);

    if (!isUpdated) {
        // FIXME: propogate errors
        res.sendStatus(422);
        return;
    }

    // update user data in req.user
    // This step updates user's display name in UI
    req.user['displayName'] = displayName;

    res.redirect('/users/profile');
})

export { userRouter };