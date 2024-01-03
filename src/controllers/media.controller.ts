import { Image } from "../entity/Image.js";
import { User } from "../entity/User.js";
import { UploadMediaAPIInternalPayloadModel } from "../models/api/media-api.model.js";
import { MediaService } from "../services/media.service.js";

export class MediaController {


    static createMediaEntry(params: UploadMediaAPIInternalPayloadModel, user: User) {
        return MediaService.createMediaEntry(params, user);
    }

    static getMediaItemById(id: number) {
        return MediaService.findMediaById(id);
    }

    static async getMediaByUser(username: string): Promise<Image[]> {
        return MediaService.fetchMediaForUserProfile(username);
    }

    static async getMediaCountByUser(username: string) {
        return MediaService.fetchMediaCountByUser(username);
    }
}