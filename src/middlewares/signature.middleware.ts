import { NextFunction, Request, Response } from "express";
import { HttpSignature } from "../models/http-signature.model.js";

export async function ensureSigned(req: Request, res: Response, next: NextFunction) {
    // Transform body to JSON for simplicity.
    let body: any = null;
    let rawBody: string = null;
    try {
        rawBody = req.body.toString('utf-8');
        body = JSON.parse(rawBody);
    } catch (ignore) { }

    const signatureHeader = req.header('signature');

    if (!signatureHeader || Object.keys(body).length == 0) {
        return res.status(400).json({ error: 'Request not signed' });
    }

    try {
        // Create HttpSignature object to simplify parsing the data
        // https://stackoverflow.com/a/10185427
        const fullURL = req.protocol + '://' + req.get('host') + req.originalUrl.split("?").shift();
        const { headers, method } = req;
        const pathUrl = new URL(fullURL)
        const path = fullURL.replace(req.protocol + '://' + pathUrl.hostname, '')
        const httpSignature = new HttpSignature({
            rawSignature: signatureHeader,
            headers,
            method,
            path,
            rawBody
        });

        await httpSignature.parse();

        if (!httpSignature) {
            // FIXME: duplicate code
            res.status(400).json({ error: 'Invalid Signature' });
            return;
        }

        const isValid = httpSignature.verify();

        if (!isValid) {
            res.status(400).json({ error: 'Signature verification failed.' });
            return;
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
        return;
    }

    next();
}
