import { MediaService } from "./media.service";
import { UserService } from "./user.service";

export class NodeInfoService {

    static async getStatistics() {
        const users = await UserService.getUserStatistics();
        const mediaCount = await MediaService.getMediaCount();

        return {
            users,
            localPosts: mediaCount,
        }
    }

}