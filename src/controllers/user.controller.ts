import { hash, compare } from "bcrypt";
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


    static async generateHashedPassword(password: string) {
        const saltRounds = 10;
        return await hash(password, saltRounds)
    }


    static async validatePasswordByUsername(username: string, password: string) {
        if (!username || !password) return false;
        const user = await this.getUserById(username);
        return await compare(password, user.password);
    }

    static async updateDisplayName(username: string, newName: string) {
        const userRepo = AppDataSource.getRepository(User);

        return await userRepo.update({ preferredUsername: username }, {
            displayName: newName
        });

    }
}