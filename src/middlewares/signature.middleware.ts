import { NextFunction, Request, Response } from "express";
import { HttpSignature } from "../models/http-signature.model.js";
import { verifyHashedData } from "../utils/signature.js";

export async function ensureSigned(req: Request, res: Response, next: NextFunction) {
    const signatureHeader = req.header('Signature');

    if (!signatureHeader) {
        return res.status(400).json({ error: 'Request not signed' });
    }

    try {
        // Create HttpSignature object to simplify parsing the data
        const httpSignature = new HttpSignature(signatureHeader, { request: req });
        await httpSignature.parse();

        const concatenatedValues = httpSignature.signedHeaderValues.reduce(
            (x: any, y: any) => (x.value || x) + y.value
        );

        // compare both signatures
        const isValid = verifyHashedData(
            httpSignature.actorPublicKey,
            concatenatedValues,
            httpSignature.signature
        );

        if (!isValid) {
            res.status(400).json({ error: 'Invalid Signature' });
            return;
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
        return;
    }


    // Transform body to JSON for simplicity.
    try {
        req.body = JSON.parse(req.body);
    } catch (ignore) {
        
    }
    next();
}
