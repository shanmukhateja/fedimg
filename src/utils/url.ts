import axios, { AxiosResponse } from "axios";
import { ServerInfo } from "../models/server-info.model";
import { isProduction } from "./misc.js";
import { Request } from "express";
import { randomUUID } from "crypto";

export function getBaseURL(serverInfo: ServerInfo) {
    return isProduction() ? `${serverInfo.schema}://${serverInfo.hostname}/` : `${serverInfo.schema}://${serverInfo.hostname}:${serverInfo.port}/`
}

// https://stackoverflow.com/a/68372568
export function generateFullURL(req: Request) {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

export function getEmailFromId(userId: string) {
    const url = new URL(userId);
    return `${url.pathname.replace('/users/', '')}@${url.origin.replace(url.protocol + '//', '')}`

}

export async function fetchRemoteDataFromURL(url: string) {

    const result = await axios.get(url, {
        headers: {
            Accept: 'application/ld+json'
        }
    });

    return result.data;
}

export function generateASId() {
    return randomUUID();
}

export function sendRequest(url: string, method: string, headers: object, data: object = {}): Promise<AxiosResponse<any, any>> {
    method = method.toLowerCase();
    if (method == 'get') {
        return axios.get(url, {
            headers,
            data
        });
    } else if (method == 'post') {
        return axios.post(url, data, {
            headers
        });
    } else {
        console.log(`Unknown request method '${method}'`)
        return axios[method](url, data);
    }
}