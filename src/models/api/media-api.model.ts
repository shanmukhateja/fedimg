import { ServerInfo } from "../server-info.model";

export interface UploadMediaAPIPayloadFileModel {
    fieldname: string,
    originalname: string,
    encoding: string,
    mimetype: string,
    destination: string,
    filename: string,
    path: string,
    size: number
}

export type UploadMediaAPIInternalPayloadModel = Exclude<UploadMediaAPIPayloadModel, ServerInfo>

export interface UploadMediaAPIPayloadModel {
    file: UploadMediaAPIPayloadFileModel,
    serverInfo: ServerInfo
}

export interface UploadMedaiAPIResponseModel {
    id: number;
    type: "Image",
    "url": string; // "https://files.mastodon.social/media_attachments/files/022/348/641/original/e96382f26c72a29c.jpeg",
    "preview_url": string; //"https://files.mastodon.social/media_attachments/files/022/348/641/small/e96382f26c72a29c.jpeg",
    "remote_url": any //null,
    "text_url": string; //"https://mastodon.social/media/4Zj6ewxzzzDi0g8JnZQ",
}