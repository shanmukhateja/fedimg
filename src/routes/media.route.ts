import { Router } from "express";
import { UploadMedaiAPIResponseModel, UploadMediaAPIPayloadModel } from "../models/api/media-api.model";
import { multerConfig } from "../middlewares/multer.js";
import { MediaAPIController } from "../controllers/api/media-api.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { MediaController } from "../controllers/media.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";

export const mediaApiRouter = Router();


mediaApiRouter.post('', ensureAuthenticated, multerConfig.single('media'), async (req, res) => {
    try {
        const params: UploadMediaAPIPayloadModel = {
            file: req.file,
        }

        // FIXME: user should be detected using Authorization header
        const user = await UserController.getUserById('suryatejak');
        const media = await MediaAPIController.createMediaEntry(params, user);
        let response: UploadMedaiAPIResponseModel = {
            id: media._id,
            type: 'Image',
            preview_url: media.path,
            url: media.path,
            remote_url: null,
            text_url: null
        }

        res.send(response);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    }
})

mediaApiRouter.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    const media = await MediaController.getMediaItemById(id);

    media ? res.send(media) : res.sendStatus(404);
})