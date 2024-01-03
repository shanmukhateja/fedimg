import { AppDataSource } from "../data-source";
import { Image } from "../entity/Image";
import { User } from "../entity/User";
import { UploadMediaAPIInternalPayloadModel } from "../models/api/media-api.model";

export class MediaService {

    static createMediaEntry(params: UploadMediaAPIInternalPayloadModel, user: User) {
        const mediaRepo = AppDataSource.getRepository(Image);
        return mediaRepo.create({
            _id: null,
            path: `${params.serverInfo.schema}://${params.serverInfo.hostname}:${params.serverInfo.port}/uploads/${params.file.filename}`,
            alt: params.alt,
            user,
            published: new Date(),
        })
        .save()
    }

    static findMediaById(id: number) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return mediaRepo.findOneBy({_id: id});
    }

    static fetchMediaForUserProfile(username: string) {
        const mediaRepo = AppDataSource.getRepository(Image);

        const queryBuilder = mediaRepo.createQueryBuilder('image');
        return queryBuilder.select('*')
        .limit(15)
        .leftJoin('image.user', 'users')
        .where("users.preferredUsername = :username", {username})
        .execute()
    }

    static fetchMediaCountByUser(username: string) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return mediaRepo.countBy({
            user: {
                preferredUsername: username
            }
        })

    }
}