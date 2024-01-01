import { AppDataSource } from "../data-source.js";
import { AuthController } from "./auth.controller.js";
import { ServerInfo } from "../models/server-info.model.js";
import { User } from "../entity/User.js";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model.js";
import { APIErrorCodes } from "../utils/errors.js";

describe('auth.controller test', () => {

    const mockServerInfo: ServerInfo = {
        hostname: 'mock.local',
        port: '8080',
        schema: 'http'
    }

    const mockRegisterPayload: RegisterUserApiPayload = {
        agreement: 'TRUE',
        email: '',
        locale: 'en-IN',
        password: '123456',
        username: ''
    }

    beforeAll(async () => {
        const db = await AppDataSource.initialize();
        expect(db).toBeTruthy();
    })

    beforeEach(async () => {
        const userRepo = AppDataSource.getRepository(User);
        const index = await userRepo.count();

        const username = `user${index + 1}`;

        mockRegisterPayload.email = username;
        mockRegisterPayload.username = username;

        // create a user
        await AuthController.registerUserAPI(mockServerInfo, mockRegisterPayload)
    })

    it('should login with correct details', async () => {
        const userOrError = await AuthController.processLogin(mockRegisterPayload.email, mockRegisterPayload.password);
        expect(userOrError instanceof User).toEqual(true);
    })

    it('should throw error on password mismatch', async () => {
        const userOrError = await AuthController.processLogin(mockRegisterPayload.email, '11223344');
        expect(userOrError).toEqual(APIErrorCodes.ERR_PASSWORD);
    })

    it('should throw error when account doesn\'t exist', async () => {
        const userOrError = await AuthController.processLogin('johndoe@example.com', mockRegisterPayload.password);
        expect(userOrError).toEqual(APIErrorCodes.ERR_ACCOUNT);
    })

})