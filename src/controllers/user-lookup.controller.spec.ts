import { UserLookupController } from "./user-lookup.controller.js";
import * as urlUtils from '../utils/url.js';
import { MastodonUserLookup } from "../models/user-lookups/lookup-mastodon.model.js";
import { UserInfoResponseModel } from "../models/user-info-response.model.js";


describe('user lookup tests', async () => {

    const mockUserEmailWithPrefix = '@user@example.com';
    const mockUserEmailWithoutPrefix = 'user@example.com';
    

    const testUserLookup = async (mockUserEmail: string) => {
        const mockWebfingerURL = 'https://example.com/.well-known/webfinger?resource=acct:user@example.com';
        const mockRemoteUserInfoURL = 'https://example.com/users/@user';

        // Create a spy for fetchRemoteDataFromURL
        const fetchRemoteDataSpy = spyOn(urlUtils, 'fetchRemoteDataFromURL');

        // Mock the first response
        const mockWebfingerResponse: MastodonUserLookup = {
            subject: "acct:user@example.com",
            aliases: [],
            links: [
                {
                    "rel": "self",
                    "type": "application/activity+json",
                    "href": mockRemoteUserInfoURL
                }
            ]
        };

        // Mock the second response
        const mockRemoteUserResponse: UserInfoResponseModel = {
            "@context": [
                "https://www.w3.org/ns/activitystreams",
            ],
            id: mockRemoteUserInfoURL,
            type: "Person",
            following: "",
            followers: "",
            inbox: "",
            outbox: "",
            featured: "",
            featuredTags: "",
            preferredUsername: "",
            name: "",
            summary: "",
            url: mockRemoteUserInfoURL,
            manuallyApprovesFollowers: false,
            discoverable: false,
            indexable: false,
            published: new Date(),
            memorial: false,
            devices: "",
            publicKey: {
                id: "",
                owner: "",
                publicKeyPem: ""
            },
            tag: [],
            attachment: [],
            endpoints: {
                sharedInbox: ""
            },
            icon: {
                type: "",
                mediaType: "",
                url: ""
            }
        };

        // Mock fetchRemoteDataSpy
        fetchRemoteDataSpy.and.callFake(async (url: string) => {
            if (url == mockWebfingerURL) return mockWebfingerResponse;

            if (url == mockRemoteUserInfoURL) return mockRemoteUserResponse;

            return null;
        });
        
        // Call lookupUser
        const response = await UserLookupController.lookupUser(mockUserEmail);

        // Asserts here

        expect(fetchRemoteDataSpy).toHaveBeenCalledWith(mockWebfingerURL);

        expect(fetchRemoteDataSpy).toHaveBeenCalledWith(mockRemoteUserInfoURL);

        expect(response).toBeTruthy();

        expect(response.email).toEqual(mockUserEmail);
    }

    it('parseUserInputString with @ prefix', async () => {
        const mockResponse = { split: ['', 'user', 'example.com'], domain: 'example.com', username: 'user', strippedEmail: 'user@example.com' };
        const output = UserLookupController.parseUserInputString(mockUserEmailWithPrefix);
        expect(output).toEqual(mockResponse);
    })

    it('parseUserInputString without @ prefix', async () => {
        const mockResponse = { split: ['user', 'example.com'], domain: 'example.com', username: 'user', strippedEmail: 'user@example.com' };
        const output = UserLookupController.parseUserInputString(mockUserEmailWithoutPrefix);
        expect(output).toEqual(mockResponse);
    })

    it('lookup user works with @ prefix in user email', async () => {
        await testUserLookup(mockUserEmailWithPrefix);
    });
    
    it('lookup user works without @ prefix in user email', async () => {
        await testUserLookup(mockUserEmailWithoutPrefix);
    });
})
