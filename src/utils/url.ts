import axios from "axios";
import { ServerInfo } from "../models/server-info.model";
import { isProduction } from "./misc.js";
import { Request } from "express";

export function getBaseURL(serverInfo: ServerInfo) {
    return isProduction() ? `${serverInfo.schema}://${serverInfo.hostname}/` : `${serverInfo.schema}://${serverInfo.hostname}:${serverInfo.port}/`
}

// https://stackoverflow.com/a/68372568
export function generateFullURL(req: Request) {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

export async function fetchRemoteDataFromURL(url: string) {
    
    const result = await axios.get(url, {
        headers: {
            Accept: 'application/ld+json'
        }
    });

    return result.data;
}