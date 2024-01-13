import { RegisterUserApiPayload } from "../models/api/register-user-api.model"
import { ServerInfo } from "../models/server-info.model"
import { generateUserId, generateUserKey, verifyUserIsLocal } from "./user"

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

    const mockValidDevUserId = `http://${mockServerInfo.hostname}:${mockServerInfo.port}/users/${mockRegisterPayload.username}`
    const mockValidProdUserId = `http://${mockServerInfo.hostname}/users/${mockRegisterPayload.username}`;

    it('should return false when username is providedd', () => {
        const result = verifyUserIsLocal(mockServerInfo, mockRegisterPayload.username);
        expect(result).toBeFalse();
    })

    it('should verify user is local test 1', () => {
        const result = verifyUserIsLocal(mockServerInfo, mockRegisterPayload.email);
        expect(result).toBeTrue();
    })

    it('should verify user is local test 2', () => {
        const mockUserEmail = `@${mockRegisterPayload.email}`;
        const result = verifyUserIsLocal(mockServerInfo, mockUserEmail);

        expect(result).toBeTrue();
    })

    it('should verify user is local test 3', () => {
        const mockUserEmail = `@mockuser@example.com`;
        const result = verifyUserIsLocal(mockServerInfo, mockUserEmail);

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
