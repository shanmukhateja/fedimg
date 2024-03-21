import { AppDataSource } from "../data-source";
import { User } from "../entity/User.js";
import { PaginationModel } from "../models/pagination.model";

export class UserService {

    static async getUserStatistics() {
        const userRepo = AppDataSource.getRepository(User);

        const total = await userRepo.count({
            where: {
                isLocal: true
            }
        });

        return {
            total,
            activeHalfyear: 0,
            activeMonth: 0
        }
    }

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
        delete user.isLocal;
        delete user.recovery_email;

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
        delete user.isLocal;
        delete user.recovery_email;

        return user;
    }

    static async addFollower(srcActor: User, destActor: User) {
        try {
            // FIXME: This is awkward.
            delete destActor.avatar;
            delete destActor.privateKey;
            delete destActor.tags;
            delete destActor.attachments;
            delete destActor.recovery_email;

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

    static async getAllFollowers(usernameOrEmail: string, paginationModel: PaginationModel) {
        const userRepo = AppDataSource.getRepository(User);

        let request$ = userRepo.createQueryBuilder('users')
            .loadAllRelationIds()
            .leftJoin('users.followers', 'followers')
            // This is needed because `getManyAndCount()` discards
            // previous select parameters
            .addSelect('users.*')
            .where('followers.preferredUsername = :usernameOrEmail', { usernameOrEmail });

        const { page, limit } = paginationModel;

        if (page) {
            request$ = request$.skip(page * limit)
                .take(limit)
        }

        // Execute query
        return await request$.getManyAndCount()
            .then((response) => {
                const [followers, count] = response;
                // set `totalItems` value
                paginationModel.totalItems = count;

                // safety
                return followers.map(follower => {
                    delete follower._id;
                    delete follower.password;
                    delete follower.privateKey;
                    delete follower.isLocal;
                    delete follower.recovery_email;

                    return follower;
                })
            })
    }

    static async getAllFollowing(usernameOrEmail: string, paginationModel: PaginationModel) {
        const userRepo = AppDataSource.getRepository(User);

        let request$ = userRepo.createQueryBuilder('users')
            .loadAllRelationIds()
            .leftJoin('users.followers', 'followers')
            // This is needed because `getManyAndCount()` discards
            // previous select parameters
            .addSelect('users.*')
            .where('followers.preferredUsername = :usernameOrEmail', { usernameOrEmail });

        const { page, limit } = paginationModel;

        // PAGE
        if (page) {
            request$ = request$.skip(page * limit)
            .take(limit)
        }

        // Execute query
        return await request$.getManyAndCount()
        .then(response => {
            const [ followers, count ] = response;
            // set `totalItems` value
            paginationModel.totalItems = count;

            // safety
            return followers.map(follower => {
                delete follower._id;
                delete follower.password;
                delete follower.privateKey;
                delete follower.isLocal;
                delete follower.recovery_email;

                return follower;
            })
        });
    }

}