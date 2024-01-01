import { Router } from "express";
import { UploadMedaiAPIResponseModel, UploadMediaAPIPayloadModel } from "../models/api/media-api.model";
import { multerConfig } from "../middlewares/multer.middleware.js";
import { MediaController } from "../controllers/media.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import * as passport from "passport";
import { User } from "../entity/User.js";

export const mediaRouter = Router();


mediaRouter.post('', passport.authenticate('session'), ensureAuthenticated, multerConfig.single('media'), async (req, res) => {
    try {
        const params: UploadMediaAPIPayloadModel = {
            file: req.file,
            alt: req.body.alt,
            serverInfo: req.app.get('serverInfo')
        }

        const user = req.user as User;
        const media = await MediaController.createMediaEntry(params, user);

        res.send({
                id: media._id,
                type: 'Image',
                preview_url: media.path,
                url: media.path,
                remote_url: null,
                text_url: null
            } as UploadMedaiAPIResponseModel);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    }
})

mediaRouter.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    const media = await MediaController.getMediaItemById(id);

    media ? res.send(media) : res.sendStatus(404);
})