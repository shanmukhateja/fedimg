import { ServerInfo } from "../models/server-info.model";
import { isProduction } from "./misc.js";

export function getBaseURL(serverInfo: ServerInfo) {
    const isProd = isProduction();

    return isProd ? `${serverInfo.schema}://${serverInfo.hostname}/` : `${serverInfo.schema}://${serverInfo.hostname}:${serverInfo.port}/`
}