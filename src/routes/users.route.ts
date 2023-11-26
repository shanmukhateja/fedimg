import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get('/:id', async (req, res) => {
    try {
        const user = await UserController.getUserByIdSafe(req.params.id);
        if (!user) {
            res.statusCode = 404;
            // Match error with Mastodon API
            res.send({ error: 'Not found' });
            return;
        }
        
        // TODO: Make it JSON+LD like.

        res.send(user);
    } catch (error) {
        console.error(error);
        res.sendStatus(500)
    }
});

export { userRouter };