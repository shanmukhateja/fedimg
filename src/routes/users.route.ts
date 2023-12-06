import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";

const userRouter = Router();

userRouter.get('/profile', ensureAuthenticated, async (req, res) => {
    UserController.renderPageWithUserInfo('home/profile.njk', req.user as User, res);
})

userRouter.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserController.getUserByIdSafe(userId);
        if (!user) {
            res.statusCode = 404;
            // Match error with Mastodon API
            res.send({ error: 'Not found' });
            return;
        }

        const isJsonLDRequired = req.accepts('application/ld+json') || req.accepts('application/activity+json');
        const isHTMLRequired = req.accepts('html');

        if (isHTMLRequired) {
            UserController.renderPageWithUserInfo('home/profile.njk', req.user as User, res);
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