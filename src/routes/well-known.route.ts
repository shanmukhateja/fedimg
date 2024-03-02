import { Router } from "express";
import { WellknownResponseModel } from "../models/well-known.model.js";
import { UserService } from "../services/user.service.js";
import { generateWellKnownResponse, processWebFingerResourceUri } from "../utils/webfinger.js";
import { User } from "../entity/User.js";
import { ServerInfo } from "../models/server-info.model.js";
import { getBaseURL } from "../utils/url.js";

const wellKnownRouter = Router();

wellKnownRouter.get('/webfinger', async (req, res) => {
    const uri = req.query.resource as string;

    const { isValid: isValidUri, values: lookupUserEmail } = processWebFingerResourceUri(uri);

    if (!isValidUri) {
        res.sendStatus(400);
        return;
    }

    // assuming email
    const lookupUserDetails: User = await UserService.getUserByKeySafe('email', lookupUserEmail);

    if (!lookupUserDetails) {
        res.sendStatus(404);
        return;
    }

    const serverInfo = res.app.get('serverInfo');
    const payload: WellknownResponseModel = generateWellKnownResponse(lookupUserDetails, serverInfo);

    // send response
    res.setHeader('Content-Type', 'application/jrd+json; charset=utf-8').send(payload);
});


wellKnownRouter.get('/nodeinfo', async (req, res) => {
    const serverInfo: ServerInfo = req.app.get('serverInfo');

    res.json({
        "links": [
            {
                "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
                "href": `${getBaseURL(serverInfo)}nodeinfo/2.0`
            }
        ]
    });
});

export { wellKnownRouter };