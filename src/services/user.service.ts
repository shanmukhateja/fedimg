import { AppDataSource } from "../data-source";
import { User } from "../entity/User.js";

export class UserService {

    static async getUserById(username: string): Promise<User> {
        // strip '@' character if exists
        if (username.startsWith('@')) {
            username = username.slice(0);
        }
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({
            preferredUsername: username
        },);

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

    static async getUserByKey<K extends keyof User>(key: K, value: any) {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOneBy({
            [key]: value
        })

        if (!user) return null;

        return user;
    }

    static async getUserByKeySafe<K extends keyof User>(key: K, value: any) {
        const user = await this.getUserByKey(key, value);

        if (!user) return null;

        delete user._id;
        delete user.password;
        delete user.privateKey;

        return user;
    }

    static async addFollower(srcActor: User, destActor: User) {
        try {
            // FIXME: This is awkward.
            delete destActor.avatar;
            delete destActor.publicKey;
            delete destActor.privateKey;
            delete destActor.tags;
            delete destActor.attachments;

            // FIXME: Need to investigate.
            destActor.isLocal = false;

            if (!srcActor.followers) {
                srcActor.followers = [];
            }
            srcActor.followers = [...srcActor.followers, destActor];

            const userRepo = AppDataSource.getRepository(User);
            await userRepo.manager.save(srcActor);

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async getAllFollowers(usernameOrEmail: string) {
        const userRepo = AppDataSource.getRepository(User);

        return await userRepo.createQueryBuilder('users')
            .loadAllRelationIds()
            .select('users.*')
            .leftJoin('users.followers', 'followers')
            .where('followers.preferredUsername = :usernameOrEmail', { usernameOrEmail })
            .execute()
            .then((followers: User[]) => followers.map(follower => {
                delete follower._id;
                delete follower.password;
                delete follower.privateKey;

                return follower;
            })
        )
    }
    
    static async getAllFollowing(usernameOrEmail: string) {
        const userRepo = AppDataSource.getRepository(User);

        return await userRepo.createQueryBuilder('users')
            .loadAllRelationIds()
            .select('users.*')
            .leftJoin('users.followers', 'followers')
            .where('followers.preferredUsername = :usernameOrEmail', { usernameOrEmail })
            .execute()
            .then((followers: User[]) => followers.map(follower => {
                delete follower._id;
                delete follower.password;
                delete follower.privateKey;

                return follower;
            })
        )
    }

    
}