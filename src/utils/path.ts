import { resolve } from "path";

export function getContentUploadPath() {
    return resolve(__dirname, '../../uploads')
}

export function getAssetsPath() {
    return resolve(__dirname, '../../public')
}