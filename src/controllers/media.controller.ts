import { AppDataSource } from "../data-source.js";
import { Image } from "../entity/Image.js";

export class MediaController {

    static async getMediaItemById(id: number) {
        const mediaRepo = AppDataSource.getRepository(Image);

        return await mediaRepo.findOneBy({_id: id});
    }
}