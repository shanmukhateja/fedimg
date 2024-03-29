import * as crypto from "crypto";
import { fetchRemoteDataFromURL, getEmailFromId } from "../utils/url";
import { PublicKey, UserInfoResponseModel } from "./user-info-response.model";
import { ed25519 } from "@noble/curves/ed25519";
import { ServerInfo } from "./server-info.model";
import { UserService } from "../services/user.service";

export interface HttpSignatureOptions {
    rawSignature: string,
    headers: NodeJS.Dict<string | string[]>,
    rawBody: string,
    method: string,
    path: string
};

export class HttpSignature {

    _impl: string;
    _implObj: any;

    options: HttpSignatureOptions = null;

    keyId: string;
    actorPublicKey: PublicKey = null;

    headers: string;
    signedHeaders: string[];
    signedHeaderValues: string;

    signature: string;

    constructor(options: HttpSignatureOptions) {
        this.options = options;
        this._impl = options?.rawSignature;
    }

    async parse() {
        this.parseRawHeader();

        if (!this._implObj) return null;

        const { keyId: keyIdString, headers: headersString, signature: signatureString } = this._implObj;

        this.keyId = keyIdString;
        this.headers = headersString;
        this.signature = signatureString;

        this.parseHeaders();

        this.parseDigestHeader();

        await this.resolveKeyId();
    }

    parseRawHeader() {
        const pairs = this._impl.split(',');

        const jsonObject = {};

        pairs.forEach(pair => {
            let [key, value] = pair.split('=');
            value = value.replace(/^"|"$/g, "");
            jsonObject[key] = value;
        });

        this._implObj = jsonObject;
    }

    parseHeaders() {
        const signedHeaders = this.headers.split(' ');

        // store Signature headers values for verifying Signature
        const headerValues = [];
        signedHeaders.forEach(header => {
            switch (header) {
                case "(request-target)":

                    headerValues.push(`${header}: ${this.options.method.toLowerCase()} ${this.options.path.toLowerCase()}`);
                    break;

                default:
                    const value = this.options.headers[header];
                    if (value)
                        headerValues.push(`${header}: ${value}`)
                    break;
            }
        });

        if (headerValues.length != signedHeaders.length) {
            throw new Error("Signature headers don't match request headers.");
        }

        this.signedHeaderValues = headerValues.reduce((prev, iter) => prev + '\n' + iter);
    }

    parseDigestHeader() {
        const digest = this.options.headers['digest'] as string;
        if (this.options.method.toLowerCase() == 'post' && !digest) {
            throw new Error('Digest header is required for this request.');
        }
        return this.verifyDigestValue(digest, this.options.rawBody);
    }

    async resolveKeyId() {
        const keyIdUrl = new URL(this.keyId);
        const url = `https://${keyIdUrl.host}${keyIdUrl.pathname}`;
        try {
            const result: UserInfoResponseModel = await fetchRemoteDataFromURL(url);
            this.actorPublicKey = result.publicKey;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * This function supports ED25519 and RSA-SHA256 algorithms to process signature verification.
     * 
     * @param key @type PublicKey to work with.
     * @param data The data to verify the signature
     * @param sig The base64 string which was sent in `Signature` header
     * @returns true or false if valid.
     */
    verify() {
        const key = crypto.createPublicKey(this.actorPublicKey.publicKeyPem);
        const data = this.signedHeaderValues;
        const sig = this.signature;

        let isValid = false;

        isValid = this.verifyWithED25519();
        if (isValid) return isValid;

        isValid = this.verifyWithRSASHA256(key, data, sig);

        return isValid;
    }

    verifyWithED25519() {

        try {
            const key = this.actorPublicKey.publicKeyPem;
            const data = this.signedHeaderValues;
            const signature = this.signature;

            const publicKeySplit = key.split('\n');

            const publicKeyBase64 = Buffer.alloc(44, publicKeySplit[1], 'base64');
            const publicKeySlice = publicKeyBase64.buffer.slice(12);
            const publicKey = Buffer.from(publicKeySlice);

            const sig = Buffer.from(signature, 'base64');

            return ed25519.verify(sig, Buffer.from(data), publicKey);
        } catch (error) {
            console.error('Failed to verify key in ED25519 format.');
            return false;
        }
    }

    verifyWithRSASHA256(key: crypto.KeyObject, data: string, sig: string) {
        try {
            return crypto.verify('SHA256', Buffer.from(data), key, Buffer.from(sig, 'base64'));
        } catch (error) {
            console.error('Failed to verify key in RSA-SHA256 format.');
            return false;
        }
    }

    // Note: Buffer.from might be needed for `data` in some cases.
    verifyDigestValue(originalDigest: string, data: string) {
        // const buffer = Buffer.from(data);
        return this.computeDigest(data) == originalDigest;
    }

    computeDigest(payload: string) {
        return crypto.createHash('sha256').update(payload).digest('base64');
    }

    computeSignatureHeader(actorId: string, data: string, privateKey: crypto.KeyObject) {
        const keyId = actorId + "#main-key";
        const sig = crypto.sign('sha256', Buffer.from(data), privateKey).toString('base64');
        return `keyId="${keyId}",headers="(request-target) host date digest",signature="${sig}"`;
    }

    /**
     * This function will generate Digest and Signature headers for a given data.
     * @param options data required to generate HTTP Signature
     * @returns the generated payload
     */
    async generate(options: {
        inboxUrl: string,
        data: object,
        senderId: string,
        recipientId: string,
        serverInfo: ServerInfo
    }) {
        const digestData = JSON.stringify(options.data);
        const digest = this.computeDigest(digestData);

        // Populate headers
        const urlObject = new URL(options.inboxUrl);
        const remoteHost = new URL(options.recipientId).origin.replace('https://', '');

        // Headers to be signed for signature header.
        const currentDate = new Date();
        const headers = [
            `(request-target): post ${urlObject.pathname}`,
            `host: ${remoteHost}`,
            `date: ${currentDate.toUTCString()}`,
            `digest: SHA-256=${digest}`
        ].join('\n');
        const senderUserEmail = getEmailFromId(options.senderId);
        const senderActorInfo = await UserService.getUserByKey('email', senderUserEmail);
        const privateKey = crypto.createPrivateKey(senderActorInfo.privateKey);

        const signature = this.computeSignatureHeader(options.senderId, headers, privateKey);

        return {
            host: remoteHost,
            date: currentDate.toUTCString(),
            digest: `SHA-256=${digest}`,
            "content-type": "application/json",
            accept: "application/json",
            signature
        };
    }

}