import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";
import { verifyUserIsLocal } from "../utils/user.js";
import { UserLookupController } from "../controllers/user-lookup.controller.js";

const userRouter = Router();

userRouter.get('/profile', ensureAuthenticated, async (req, res) => {
    UserController.renderPageWithUserInfo('home/profile.njk', req.user as User, res);
})

userRouter.get('/:usernameOrEmail', async (req, res) => {
    try {
        const usernameOrEmail = req.params.usernameOrEmail;
        const isUserLocal = verifyUserIsLocal(req.app.get('serverInfo'), usernameOrEmail);
        let user = null;
        if (isUserLocal) {
            user = await UserController.getUserByIdSafe(usernameOrEmail);
            if (!user) {
                // try email
                const strippedUserId = usernameOrEmail.startsWith('@') ? usernameOrEmail.slice(1) : usernameOrEmail;
                user = await UserController.getUserByKeySafe('email', strippedUserId);
            }
        } else {
            // Sends a 'mock' User.entity.ts object
            user = await UserLookupController.lookupUser(usernameOrEmail);
        }
        if (!user) {
            res.statusCode = 404;
            // Match error with Mastodon API
            res.send({ error: 'Not found' });
            return;
        }

        const isJsonLDRequired = req.accepts('application/ld+json') || req.accepts('application/activity+json');
        const isHTMLRequired = req.accepts('html');

        if (isHTMLRequired) {
            let determineUser: User = null;
            determineUser = req.isAuthenticated() ? (req.user as User).email == user.email ? req.user : user : user;
            UserController.renderPageWithUserInfo('home/profile.njk', determineUser, res);
            return;
        }

        // TODO: Make it JSON+LD like.

        res.send(user);
    } catch (error) {
        console.error(error);
        res.sendStatus(500)
    }
});

userRouter.post('/profile/update-name', ensureAuthenticated, async (req, res) => {
    const { displayName } = req.body;
    if (!displayName) {
        res.sendStatus(400)
        return;
    }

    const isUpdated = await UserController.updateDisplayName(req.user['username'], displayName);

    if (!isUpdated) {
        // FIXME: propogate errors
        res.sendStatus(422);
        return;
    }

    res.redirect('/users/profile');
})

export { userRouter };