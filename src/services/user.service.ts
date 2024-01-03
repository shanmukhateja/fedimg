import { AppDataSource } from "../data-source";
import { User } from "../entity/User.js";

export class UserService {

    userRepo = AppDataSource.getRepository(User);


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

        return user;
    }

    // FIXME: find a better way
    static async getUserByIdSafe(username: string): Promise<User> {

        const user = await this.getUserById(username);

        if (!user) return null;

        delete user._id;
        delete user.password;
        delete user.privateKey;

        return user;
    }

    static async getUserByKey(key: string, value: any) {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOneBy({
            [key]: value
        })

        if (!user) return null;

        return user;
    }
    static async getUserByKeySafe(key: string, value: any) {
        const user = await this.getUserByKey(key, value);

        if (!user) return null;

        delete user._id;
        delete user.password;
        delete user.privateKey;

        return user;
    }

}