import { AppDataSource } from "../data-source.js";
import { AuthController } from "./auth.controller.js";
import { ServerInfo } from "../models/server-info.model.js";
import { User } from "../entity/User.js";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model.js";
import { APIErrorCodes, generateErrorResponse } from "../utils/errors.js";
import * as url from 'url';
import { Request, Response } from "express";

describe('auth.controller test', () => {

    async function _testWithAPIErrorCode(errorCode: APIErrorCodes) {
        const { key, description } = generateErrorResponse(errorCode);
        const path = url.format({
            pathname: '/auth/login',
            query: {
                key, description
            }
        });
        await AuthController.handlePOSTForLogin(mockRequest, mockResponse);
        // @ts-ignore
        expect(mockResponse.redirect).toHaveBeenCalledWith(path);
    }

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

    const mockRequest = jasmine.createSpyObj<Request>('Request', ['body', 'login', 'logout', 'app']);
    const mockResponse = jasmine.createSpyObj<Response>('Response', ['redirect', 'status', 'statusCode', 'send']);

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

        // default values for mock request
        // Note: This fixes unit tests failing at random
        mockRequest.app.get = function () { return mockServerInfo as any }
        mockRequest.body = mockRegisterPayload;

        // create a user
        await AuthController.handlePOSTForRegistration(mockRequest, mockResponse);
        mockRequest.body = mockRegisterPayload;
    })

    it('should login with correct details', async () => {
        await AuthController.handlePOSTForLogin(mockRequest, mockResponse);
        expect(mockRequest.login).toHaveBeenCalled();
    })

    it('should throw error on password mismatch', async () => {
        mockRequest.body.password = '1111'
        await _testWithAPIErrorCode(APIErrorCodes.ERR_PASSWORD);
    })

    it('should throw error when account doesn\'t exist', async () => {
        mockRequest.body.email = 'foobar@example.com'
        await AuthController.handlePOSTForLogin(mockRequest, mockResponse);
        await _testWithAPIErrorCode(APIErrorCodes.ERR_ACCOUNT);
    })

})