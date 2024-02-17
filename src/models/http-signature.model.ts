import { verifyDigestValue } from "../utils/signature";
import { fetchRemoteDataFromURL } from "../utils/url";
import { PublicKey, UserInfoResponseModel } from "./user-info-response.model";
import { Request } from "express";

export interface HttpSignatureOptions {
    request: Request
};

export class HttpSignature {

    _impl: string;

    keyId: string;
    actorPublicKey: PublicKey = null;


    incomingRequest: HttpSignatureOptions['request'];
    headers: string;
    signedHeaders: string[];
    signedHeaderValues: string[];

    signature: string;

    private KEYEQVALUE_REGEX = /\s*=\s*(.+)/;

    constructor(impl: string, options: HttpSignatureOptions) {
        this._impl = impl;
        this.incomingRequest = options.request;
    }

    async parse() {
        const split = this._impl.split(',');

        if (split.length != 3) {
            return null;
        }

        const [keyIdString, headersString, signatureString] = split;

        // https://stackoverflow.com/a/73395765
        this.keyId = JSON.parse(keyIdString.split(this.KEYEQVALUE_REGEX).filter(e => e.length > 0)[1]);
        this.headers = JSON.parse(headersString.split(this.KEYEQVALUE_REGEX).filter(e => e.length > 0)[1]);
        this.signature = JSON.parse(signatureString.split(this.KEYEQVALUE_REGEX).filter(e => e.length > 0)[1]);

        this.parseHeaders();

        this.parseDigestHeader();

        await this.resolveKeyId();
    }

    parseHeaders() {
        const signedHeaders = this.headers.split(' ');

        // store Signature headers values for verifying Signature
        const headerValues = [];
        signedHeaders.forEach(header => {
            switch (header) {
                case "(request-target)":
                    headerValues.push({
                        label: header,
                        value: `${this.incomingRequest.method.toLowerCase()} ${this.incomingRequest.path.toLowerCase()}`
                    });
                    break;

                default:
                    const value = this.incomingRequest.headers[header];
                    if (value)
                        headerValues.push({ label: header, value })
                    break;
            }
        });

        if (headerValues.length != signedHeaders.length) {
            throw new Error("Signature headers don't match request headers.");
        }

        this.signedHeaderValues = headerValues;
    }

    parseDigestHeader() {
        const digest = this.incomingRequest.header('Digest');
        if (this.incomingRequest.method == 'POST' && !digest) {
            throw new Error('Digest header is required for this request.');
        }

        // FIXME: JSON.stringify strips whitespace in JSON body
        // which will lead to hash mismatch.
        verifyDigestValue(digest, JSON.stringify(this.incomingRequest.body));
    }

    async resolveKeyId() {
        const keyIdUrl = new URL(this.keyId);
        const url = `https://${keyIdUrl.host}/${keyIdUrl.pathname}`;
        try {
            const result: UserInfoResponseModel = await fetchRemoteDataFromURL(url);
            this.actorPublicKey = result.publicKey;
        } catch (error) {
            console.error(error);
        }
    }

}