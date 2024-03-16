import { Request, Response } from "express"
import { AuthController } from "../controllers/auth.controller"
import { AppDataSource } from "../data-source"
import { RegisterUserApiPayload } from "../models/api/register-user-api.model"
import { ServerInfo } from "../models/server-info.model"
import { generateWellKnownResponse, processWebFingerResourceUri } from "./webfinger"
import { User } from "../entity/User"
import { UserService } from "../services/user.service"
import { WellknownResponseModel } from "../models/well-known.model"
import { getBaseURL } from "./url"

describe('media controller tests', () => {

    const mockServerInfo: ServerInfo = {
        hostname: 'mock.local',
        port: '8080',
        schema: 'http'
    }

    const mockRegisterPayload: RegisterUserApiPayload = {
        agreement: 'TRUE',
        email: `mockuser@${mockServerInfo.hostname}`,
        locale: 'en-IN',
        password: '123456',
        username: 'mockuser'
    }
    async function _createMockUser() {

        const userRepo = AppDataSource.getRepository(User);
        const index = await userRepo.count();

        const username = `user${index + 1}`;

        mockRegisterPayload.username = username;
        mockRegisterPayload.email = `${username}@${mockServerInfo.hostname}`;


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


    it('should parse incoming webfinger resource uri test 1', () => {
        const result = processWebFingerResourceUri(`acct:${mockRegisterPayload.email}`);
        expect(result.isValid).toBeTrue();

        expect(result.values).toBe(mockRegisterPayload.email)
    })

    it('should parse incoming webfinger resource uri test 2', () => {
        const result = processWebFingerResourceUri(`acct:@${mockRegisterPayload.email}`);
        expect(result.isValid).toBeFalse();
    })

    it('should parse incoming webfinger resource uri test 3', () => {
        const result = processWebFingerResourceUri(`acct:${mockRegisterPayload.username}`);
        expect(result.isValid).toBeFalse();
    })

    it('should generate valid well known response', async () => {
        const mockUser = await UserService.getUserById(mockRegisterPayload.username);
        const result = generateWellKnownResponse(mockUser, mockServerInfo);

        const expectedResult: WellknownResponseModel = {
            subject: `acct:${mockRegisterPayload.email}`,
            aliases: [],
            links: [
                {
                    rel: "http://webfinger.net/rel/profile-page",
                    type: "text/html",
                    href: `${getBaseURL(mockServerInfo)}users/${mockRegisterPayload.username}`
                },
                {
                    rel: "self",
                    type: "application/activity+json",
                    href: `${getBaseURL(mockServerInfo)}users/${mockRegisterPayload.username}`
                },
            ]
        }

        expect(result).toEqual(expectedResult);
    })
   
    it('should generate valid well known response with avatar', async () => {
        const mockUser = await UserService.getUserById(mockRegisterPayload.username);

        const mockAvatarInfo = {
            mediaType: 'image/jpeg',
            type: 'Image',
            url: 'https://example.com/avatar.jpg'
        };
        mockUser.avatar = mockAvatarInfo;

        const result = generateWellKnownResponse(mockUser, mockServerInfo);

        const expectedResult: WellknownResponseModel = {
            subject: `acct:${mockRegisterPayload.email}`,
            aliases: [],
            links: [
                {
                    rel: "http://webfinger.net/rel/profile-page",
                    type: "text/html",
                    href: `${getBaseURL(mockServerInfo)}users/${mockRegisterPayload.username}`
                },
                {
                    rel: "self",
                    type: "application/activity+json",
                    href: `${getBaseURL(mockServerInfo)}users/${mockRegisterPayload.username}`
                },
                {
                    "rel": "http://webfinger.net/rel/avatar",
                    "type": mockAvatarInfo.mediaType,
                    "href": mockAvatarInfo.url
                }
            ]
        }

        expect(result).toEqual(expectedResult);
    })

})