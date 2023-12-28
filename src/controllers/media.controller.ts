import { AppDataSource } from "../data-source.js";
import { Image } from "../entity/Image.js";
import { User } from "../entity/User.js";
import { UploadMediaAPIInternalPayloadModel } from "../models/api/media-api.model.js";

export class MediaController {


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

    static async getMediaItemById(id: number) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return await mediaRepo.findOneBy({_id: id});
    }

    static async getMediaByUser(username: string): Promise<Image[]> {
        const mediaRepo = AppDataSource.getRepository(Image);

        const queryBuilder = mediaRepo.createQueryBuilder('image');
        return await queryBuilder.select('*')
        .limit(15)
        .leftJoin('image.user', 'users')
        .where("users.preferredUsername = :username", {username})
        .execute()
    }

    static async getMediaCountByUser(username: string) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return await mediaRepo.countBy({
            user: {
                preferredUsername: username
            }
        })
    }
}