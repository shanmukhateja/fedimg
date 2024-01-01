import axios from "axios";
import { ServerInfo } from "../models/server-info.model";
import { isProduction } from "./misc.js";

export function getBaseURL(serverInfo: ServerInfo) {
    const isProd = isProduction();

    return isProd ? `${serverInfo.schema}://${serverInfo.hostname}/` : `${serverInfo.schema}://${serverInfo.hostname}:${serverInfo.port}/`
}

export async function fetchRemoteDataFromURL(url: string) {
    
    const result = await axios.get(url, {
        headers: {
            Accept: 'application/ld+json'
        }
    });

    return result.data;
}