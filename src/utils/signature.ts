import { createHash, createVerify } from "crypto";
import { ed25519 } from '@noble/curves/ed25519';
import { PublicKey } from "../models/user-info-response.model";

export function signAndHashData(value: string) {
    const h = createHash('rsa-sha256');

    h.write(value);

    return h.digest('base64');
}

/**
 * This function supports ED25519 and RSA-SHA256 algorithms to process signature verification.
 * 
 * @param key @type PublicKey to work with.
 * @param data The data to verify the signature
 * @param sig The base64 string which was sent in `Signature` header
 * @returns true or false if valid.
 */
export function verifyHashedData(key: PublicKey, data: string, sig: string) {

    let isValid = false;

    isValid = verifyWithED25519(key, data, sig);
    if (isValid) return isValid;

    isValid = verifyWithRSASHA256(key, data, sig);

    return isValid;
}

function verifyWithED25519(key: PublicKey, data: string, signature: string) {
    try {
        const publicKeySplit = key.publicKeyPem.split('\n');

        const publicKeyBase64 = Buffer.alloc(44, publicKeySplit[1], 'base64');
        const publicKeySlice = publicKeyBase64.buffer.slice(12);
        const publicKey = Buffer.from(publicKeySlice);

        const sig = Buffer.from(signature, 'base64');

        return ed25519.verify(sig, Buffer.from(data), publicKey);
    } catch (error) {
        console.error(error);
        return false;
    }
}

function verifyWithRSASHA256(key: PublicKey, data: string, sig: string) {
    try {
        const publicKey = key.publicKeyPem;
    
        const decodedData = Buffer.from(sig, 'base64');
    
        // Create a verifier object
        const verifier = createVerify('RSA-SHA256');
    
        // Supply the data to be verified
        verifier.write(decodedData);
    
        // Verify the signature using the public key
        return verifier.verify(publicKey, data);
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function verifyDigestValue(originalDigest: string, data: string) {
    const payloadBuf = Buffer.from(data);

    const sign = createHash('RSA-SHA256');

    sign.update(payloadBuf);

    const out = sign.digest('base64');
    console.log(out)

    return out == originalDigest;
}