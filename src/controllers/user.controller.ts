import { AppDataSource } from "../data-source.js";
import { User } from "../entity/User.js";

export class UserController {

    static async getUserById(username: string): Promise<User> {
        // strip '@' character if exists
        if (username.startsWith('@')) {
            username = username.slice(0);
        }
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({
            preferredUsername: username
        });

        if (!user) return null;

        // FIXME: find a better way
        delete user._id;

        return user;
    }
}