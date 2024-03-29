import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { User } from "../entity/User.js";
import { renderPageWithUserInfo } from "../utils/render.js";
import { ensureSigned } from "../middlewares/signature.middleware.js";
import { ActivityController } from "../controllers/activity.controller.js";
import { UserService } from "../services/user.service.js";
import { generateCollectionPageResponse, generateCollectionResponse } from "../utils/collection.js";
import { generateFullURL } from "../utils/url.js";
import { PaginationModel } from "../models/pagination.model.js";

export const userRouter = Router();

userRouter.get('/profile', ensureAuthenticated, async (req, res) => {
    renderPageWithUserInfo('home/profile.njk', req.user as User, res);
})

userRouter.post('/:usernameOrEmail/inbox', ensureSigned, async (req, res) => {

    console.log('request body:', req.body);
    const { type } = req.body;
    const typeValue = ActivityController.determineActivityType(type);
    if (typeValue == 'AS') {
        return ActivityController.handleActivityStreamEvent(req.body, res);
    }

    res.sendStatus(404);
})

userRouter.get('/:usernameOrEmail/followers', async (req, res) => {

    const { usernameOrEmail } = req.params;
    const page = req.query.page as string;
    const limit = req.query.limit as string;
    
    // Note: `totalItems` will be set after db query
    const paginationModel = new PaginationModel(page, limit, 0);

    const followers = await UserService.getAllFollowers(usernameOrEmail, paginationModel);
    const id = generateFullURL(req);

    if (!page) {
        return res.send(generateCollectionResponse(id, paginationModel));
    }

    return res.send(generateCollectionPageResponse<User>(followers, id, paginationModel ));
})

userRouter.get('/:usernameOrEmail/following', async (req, res) => {

    const { usernameOrEmail } = req.params;
    const { page } = req.query;
    const id = generateFullURL(req);

    // @ts-ignore
    const paginationModel = new PaginationModel(page, null, 0);

    const following = await UserService.getAllFollowing(usernameOrEmail, paginationModel);

    // Send OrderedCollection response
    if (!page) {

        const id = generateFullURL(req);

        return res.send(generateCollectionResponse(id, paginationModel));
    }

    return res.send(generateCollectionPageResponse<User>(following, id, paginationModel ));
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
