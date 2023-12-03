import { User } from "../entity/User.js";
import { APIErrorCodes } from "../utils/errors.js";
import { UserController } from "./user.controller.js";

export class AuthController {

    static async processLogin(email: string, password: string): Promise<User|APIErrorCodes> {

        const user = await UserController.getUserByKey('email', email);

        if (!user) return APIErrorCodes.ERR_ACCOUNT;

        const isPasswordOkay = await user.validPassword(password);

        if (!isPasswordOkay) return APIErrorCodes.ERR_PASSWORD;

        return user;

    }
}