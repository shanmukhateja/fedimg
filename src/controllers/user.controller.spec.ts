import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model";
import { ServerInfo } from "../models/server-info.model";
import { AuthController } from "./auth.controller";
import { UserController } from "./user.controller";
import { UserService } from "../services/user.service";

describe('user controller tests', () => {

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
        username: 'mockuser'
    }

    async function _createMockUser() {

        const userRepo = AppDataSource.getRepository(User);
        const index = await userRepo.count();

        const username = `user${index + 1}`;

        mockRegisterPayload.email = username;
        mockRegisterPayload.username = username;


        const mockRequest = jasmine.createSpyObj<Request>('Request', ['body', 'login', 'logout', 'app']);
        const mockResponse = jasmine.createSpyObj<Response>('Response', ['redirect', 'status', 'statusCode', 'send']);

        mockRequest.app.get = function () { return mockServerInfo as any }
        mockRequest.body = mockRegisterPayload;
        await AuthController.handlePOSTForRegistration(mockRequest, mockResponse);
    }

    beforeAll(async () => {
        const db = await AppDataSource.initialize();
        expect(db).toBeTruthy();

        // create fake user
        await _createMockUser();
    })

    afterAll(async () => {
        await AppDataSource.destroy();
    })

    it('should update user name', async () => {

        const newName = 'John Doe';

        // before name change

        let mockUser = await UserService.getUserById(mockRegisterPayload.username);
        expect(mockUser.displayName).toBe(mockRegisterPayload.username);

        // change name
        await UserController.updateDisplayName(mockRegisterPayload.username, newName);

        // test
        mockUser = await UserService.getUserById(mockRegisterPayload.username);
        expect(mockUser).toBeTruthy();
        expect(mockUser.displayName).toBe(newName);
    })

    it('should return false when invalid input is given for validate user password', async () => {
        const test1 = await UserController.validatePasswordByUsername(null, '');
        const test2 = await UserController.validatePasswordByUsername('null', null);
        expect(test1).toBeFalse();
        expect(test2).toBeFalse();

    })

    it('should validate user password', async () => {
        const result = await UserController.validatePasswordByUsername(mockRegisterPayload.username, mockRegisterPayload.password);
        expect(result).toBeTrue();
    })
})