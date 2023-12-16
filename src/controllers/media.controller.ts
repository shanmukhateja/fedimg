import { AppDataSource } from "../data-source.js";
import { Image } from "../entity/Image.js";

export class MediaController {

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