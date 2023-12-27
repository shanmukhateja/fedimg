import { AppDataSource } from "../../data-source.js";
import { Image } from "../../entity/Image.js";
import { User } from "../../entity/User.js";
import { UploadMediaAPIInternalPayloadModel} from "../../models/api/media-api.model.js";

export class MediaAPIController {

    static async createMediaEntry(params: UploadMediaAPIInternalPayloadModel, user: User) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return await mediaRepo.create({
            _id: null,
            path: `${params.serverInfo.schema}://${params.serverInfo.hostname}:${params.serverInfo.port}/uploads/${params.file.filename}`,
            alt: params.alt,
            user,
            published: new Date(),
        })
        .save()
    }
}