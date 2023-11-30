import { User } from "../entity/User.js";
import { UserController } from "./user.controller.js";

export class AuthController {

    static async processLogin(email: string, password: string): Promise<User|string> {

        const user = await UserController.getUserByKey('email', email);

        if (!user) return 'ERR_ACCOUNT';

        const isPasswordOkay = await user.validPassword(password);

        if (!isPasswordOkay) return 'ERR_PASSWORD';

        return user;

    }
}