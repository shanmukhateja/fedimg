import { AppDataSource } from "../data-source"
import { User } from "../entity/User"
import { RegisterUserApiPayload } from "../models/api/register-user-api.model"
import { ServerInfo } from "../models/server-info.model"
import { AuthService } from "../services/auth.service"
import { generateUserId, generateUserKey, verifyUserIsLocal } from "./user"

describe('user utils tests', () => {

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

    let mockValidDevUserId = `http://${mockServerInfo.hostname}:${mockServerInfo.port}/users/`
    let mockValidProdUserId = `http://${mockServerInfo.hostname}/users/`;

    beforeAll(async () => {
        await AppDataSource.initialize();
        const userRepo = AppDataSource.getRepository(User);

        const index = await userRepo.count();

        const username = `user${index + 1}`;

        mockRegisterPayload.email = `${username}@${mockServerInfo.hostname}`;
        mockRegisterPayload.username = username;

        // create a user
        await AuthService.registerUserAPI(mockServerInfo, mockRegisterPayload);

        mockValidDevUserId = mockValidDevUserId+mockRegisterPayload.username;
        mockValidProdUserId = mockValidProdUserId+mockRegisterPayload.username;
    })

    afterAll(async () => {
        await AppDataSource.destroy();
    })

    it('should return false when username is provided', async () => {
        const result = await verifyUserIsLocal(mockServerInfo, mockRegisterPayload.username);
        expect(result).toBeTrue();
    })

    it('should verify user is local test 1', async () => {
        const result = await verifyUserIsLocal(mockServerInfo, mockRegisterPayload.email);
        expect(result).toBeTrue();
    })

    it('should verify user is local test 2', async () => {
        const mockUserEmail = `@${mockRegisterPayload.email}`;
        const result = await verifyUserIsLocal(mockServerInfo, mockUserEmail);

        expect(result).toBeTrue();
    })

    it('should verify user is local test 3', async () => {
        const mockUserEmail = `@mockuser@example.com`;
        const result = await verifyUserIsLocal(mockServerInfo, mockUserEmail);

        expect(result).toBeFalse();
    })

    it('should generate valid dev env user id', () => {
        const result = generateUserId(mockServerInfo, mockRegisterPayload.username);
        expect(result).toBe(mockValidDevUserId);
    })

    it('should generate valid prod user id', () => {
        process.env.NODE_ENV = 'production';

        const result = generateUserId(mockServerInfo, mockRegisterPayload.username);
        expect(result).toBe(mockValidProdUserId);

        process.env.NODE_ENV = 'testing';
    })

    it('should generate user key-pairs', async () => {
        const keyPair = await generateUserKey(mockServerInfo, mockRegisterPayload.username);

        expect(keyPair).toBeTruthy();
        expect(keyPair.userPublicKey).toBeTruthy();
        expect(keyPair.privateKey).toBeTruthy();

        expect(keyPair.userPublicKey.owner).toBe(mockValidDevUserId);
        expect(keyPair.userPublicKey.id).toBe(`${mockValidDevUserId}#main-key`);
    })
})
