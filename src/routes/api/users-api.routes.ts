import { Router } from "express";
import { UserApiController } from "../../controllers/api/users-api.controller.js";
import { APIErrorCodes, generateErrorResponse } from "../../utils/errors.js";
import { RegisterUserApiPayload } from "../../models/api/register-user-api.model.js";
import { ServerInfo } from "../../models/server-info.model.js";

export const usersApiRouter = Router();

usersApiRouter.post('', async (req, res) => {
    const params = req.body as RegisterUserApiPayload;
    const serverInfo: ServerInfo = req.app.get('serverInfo');
    // console.log(params)

    // TODO: validation

    try {
        if (params.agreement != 'TRUE') throw new Error(APIErrorCodes.ERR_ACCEPTED);
        const userOrError = await UserApiController.registerUserAPI(serverInfo, params);
        if (typeof userOrError != 'string') {
            res.sendStatus(200);
        } else {
            // typeorm error
            // FIXME: types needed
            const errorCode = userOrError == 'ER_DUP_ENTRY' ? APIErrorCodes.ERR_TAKEN : APIErrorCodes.ERR_INVALID;
            throw new Error(errorCode)
        }
    } catch (error) {
        res.statusCode = 422;
        res.send(generateErrorResponse(error.message));
    }
})