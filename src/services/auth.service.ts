import { UserController } from "../controllers/user.controller.js";
import { AppDataSource } from "../data-source.js";
import { User } from "../entity/User.js";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model.js";
import { ServerInfo } from "../models/server-info.model.js";
import { APIErrorCodes } from "../utils/errors";
import { generateUserKey } from "../utils/user.js";
import { UserService } from "./user.service";


export class AuthService {

    static async registerUserAPI(serverInfo: ServerInfo, params: RegisterUserApiPayload) {
        try {
            const userRepo = AppDataSource.getRepository(User);
            const { userPublicKey: publicKey, privateKey } = await generateUserKey(serverInfo, params.username);

            // TODO validation

            const hashedPassword = await UserController.generateHashedPassword(params.password);

            // @ts-ignore
            let user: User = {
                _id: null,
                id: publicKey.owner,
                type: 'Person',
                preferredUsername: params.username,
                // Note: User can update this after login
                displayName: params.username,
                // FIXME: improve email generation
                email: `${params.username}@${serverInfo.hostname}`,
                recovery_email: params.email,
                password: hashedPassword,
                followers: [],
                publicKey,
                privateKey
            }

            return await userRepo.create(user)
                .save()
        } catch (error) {
            console.log('got error saving user from user-api.controller', error, error.code)
            console.log(error);
            return error.code;
        }
    }

    static async processLogin(email: string, password: string): Promise<User | APIErrorCodes> {

        const user = await UserService.getUserByKey('recovery_email', email);

        if (!user) return APIErrorCodes.ERR_ACCOUNT;

        const isPasswordOkay = await user.validPassword(password);

        if (!isPasswordOkay) return APIErrorCodes.ERR_PASSWORD;

        return user;
    }
}