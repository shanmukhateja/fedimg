import { AppDataSource } from "../../data-source.js";
import { Image } from "../../entity/Image.js";
import { User } from "../../entity/User.js";
import { UploadMediaAPIPayloadModel } from "../../models/api/media-api.model.js";

export class MediaAPIController {

    static async createMediaEntry(params: UploadMediaAPIPayloadModel, user: User) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return await mediaRepo.create({
            _id: null,
            // FIXME: use env var here
            path: `http://localhost:8000/${params.file.filename}`,
            user,
            published: new Date(),
        })
        .save()
    }
}