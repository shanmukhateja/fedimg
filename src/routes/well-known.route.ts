import { Router } from "express";
import { WellknownResponseModel } from "../models/well-known.model.js";
import { UserController } from "../controllers/user.controller.js";
import { generateWellKnownResponse, processWebFingerResourceUri } from "../utils/webfinger.js";
import { User } from "../entity/User.js";

const wellKnownRouter = Router();

wellKnownRouter.get('/webfinger', async (req, res) => {
    const uri = req.query.resource as string;

    const { isValid: isValidUri, values: lookupUserEmail } = processWebFingerResourceUri(uri);

    if (!isValidUri) {
        res.sendStatus(400);
        return;
    }

    // assuming email
    const lookupUserDetails: User = await UserController.getUserByKeySafe('email', lookupUserEmail);

    if (!lookupUserDetails) {
        res.sendStatus(404);
        return;
    }

    const serverInfo = res.app.get('serverInfo');
    const payload: WellknownResponseModel = generateWellKnownResponse(lookupUserDetails, serverInfo);

    // send response
    res.setHeader('Content-Type', 'application/jrd+json; charset=utf-8').send(payload);
});


export { wellKnownRouter };