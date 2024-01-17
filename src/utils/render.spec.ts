import { Request, Response } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model";
import { ServerInfo } from "../models/server-info.model";
import { renderPageWithUserInfo } from "./render";
import { UserService } from "../services/user.service";
import { RenderPagePayload } from "../models/render-page-response.model";

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

    it('should render profile page for local user', async () => {
        const mockUser = await UserService.getUserById(mockRegisterPayload.username);
        const mockPageURL = 'home/profile.njk';

        const mockRequest = jasmine.createSpyObj<Request>('Request', ['user', 'isAuthenticated']);
        const mockResponse = jasmine.createSpyObj<Response>('Response', ['render', 'app', 'req']);

        // attach required attributes
        mockRequest.isAuthenticated.and.returnValue(true);
        mockResponse.app = {
            get: () => mockServerInfo
        } as any;
        mockRequest.user = mockUser;
        mockResponse.req = mockRequest;

        await renderPageWithUserInfo(mockPageURL, mockUser, mockResponse);

        const expectedResult: RenderPagePayload = {
            isLoggedIn: true,
            showProfileEditOptions: true,
            loggedInUser: {
                name: mockRegisterPayload.username,
                username: mockRegisterPayload.username,
                userEmail: mockRegisterPayload.email,
                userAvatar: undefined,
                userTags: [],
                userAttachments: []
            },
            metadata: {
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                showFollowButton: true
            },
            profileUser: {
                name: mockRegisterPayload.username,
                username: mockRegisterPayload.username,
                userEmail: mockRegisterPayload.email,
                userAvatar: undefined,
                userTags: [],
                userAttachments: []
            },
            posts: []
        }

        expect(mockResponse.render).toHaveBeenCalledWith(mockPageURL, expectedResult);
    })

    it('should render profile page for local user w/o authentication', async () => {
        const mockUser = await UserService.getUserById(mockRegisterPayload.username);
        const mockPageURL = 'home/profile.njk';

        const mockRequest = jasmine.createSpyObj<Request>('Request', ['user', 'isAuthenticated']);
        const mockResponse = jasmine.createSpyObj<Response>('Response', ['render', 'app', 'req']);

        // attach required attributes
        mockRequest.isAuthenticated.and.returnValue(false);
        mockResponse.app = {
            get: () => mockServerInfo
        } as any;
        mockRequest.user = mockUser;
        mockResponse.req = mockRequest;

        await renderPageWithUserInfo(mockPageURL, mockUser, mockResponse);

        const expectedResult: RenderPagePayload = {
            isLoggedIn: false,
            showProfileEditOptions: true,
            metadata: {
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                showFollowButton: true
            },
            profileUser: undefined,
            posts: []
        }

        expect(mockResponse.render).toHaveBeenCalledWith(mockPageURL, expectedResult);
    })

    it('should render profile page for remote user', async () => {
        const mockUser = await UserService.getUserById(mockRegisterPayload.username);
        const mockPageURL = 'home/profile.njk';

        const mockRequest = jasmine.createSpyObj<Request>('Request', ['user', 'isAuthenticated']);
        const mockResponse = jasmine.createSpyObj<Response>('Response', ['render', 'app', 'req']);

        // attach required attributes
        mockRequest.isAuthenticated.and.returnValue(false);
        mockResponse.app = {
            get: () => mockServerInfo
        } as any;
        mockRequest.user = null;
        mockResponse.req = mockRequest;

        await renderPageWithUserInfo(mockPageURL, mockUser, mockResponse);

        const expectedResult: RenderPagePayload = {
            isLoggedIn: false,
            showProfileEditOptions: false,
            metadata: {
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                showFollowButton: true
            },
            profileUser: {
                name: mockRegisterPayload.username,
                username: mockRegisterPayload.username,
                userEmail: mockRegisterPayload.email,
                userAvatar: null,
                userTags: null,
                userAttachments: null
            },
            posts: []
        }

        expect(mockResponse.render).toHaveBeenCalledWith(mockPageURL, expectedResult);
    })

})