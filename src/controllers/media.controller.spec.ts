import { Request, Response } from "express";
import { UploadMediaAPIInternalPayloadModel } from "../models/api/media-api.model";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model";
import { ServerInfo } from "../models/server-info.model";
import { AuthController } from "./auth.controller";
import { MediaController } from "./media.controller";
import { UserService } from "../services/user.service";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

describe('media controller tests', () => {

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

    async function _createMockMediaEntry() {

        const mockUser = await UserService.getUserByKey('email', mockRegisterPayload.email);

        const payload: UploadMediaAPIInternalPayloadModel = {
            serverInfo: mockServerInfo,
            file: {
                destination: '/tmp/mock.jpg',
                encoding: '',
                fieldname: '',
                mimetype: 'image/jpg',
                filename: 'mock.jpg',
                originalname: 'mock-orig.jpg',
                path: '/tmp/mock-path.jpg',
                size: 100
            }
        }

        return await MediaController.createMediaEntry(payload, mockUser);
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

    it('creates new media item', async () => {
        const image = await _createMockMediaEntry();
        expect(image._id).toBeTruthy();
    })

    it('should fetch media by id', async () => {
        const image = await _createMockMediaEntry();

        const fetchedImage = await MediaController.getMediaItemById(image._id);

        expect(fetchedImage._id).toEqual(image._id);
    })

    it('should fetch media by user email', async () => {
        // for cases where this test runs on empty db
        await _createMockMediaEntry();

        const image = await MediaController.getMediaByUser(mockRegisterPayload.email);

        expect(image.length).toBeGreaterThan(0);
    })

    it('should fetch media count by user email', async () => {
        // for cases where this test runs on empty db
        await _createMockMediaEntry();

        const count = await MediaController.getMediaCountByUser(mockRegisterPayload.email);

        expect(count).toBeGreaterThan(0);
    })
})