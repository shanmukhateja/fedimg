import multer from "multer";
import * as uuid from 'uuid';
import { UploadMediaAPIPayloadFileModel } from "../models/api/media-api.model";
import path from 'path';
import { getContentUploadPath } from "../utils/path.js";

const multerConfig = multer({ 
    fileFilter: (_req, file: UploadMediaAPIPayloadFileModel, cb) => {
        // Note: This can be improved.
        const fileExt = path.extname(file.originalname);
        const uploadAccepted = ['.jpg', '.jpeg', '.png'].includes(fileExt);
        if (uploadAccepted) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file format.'));
        }
    },
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null,getContentUploadPath())
        },
        filename: (req, file, callback) => {
            const fileExt = path.extname(file.originalname);
            const newName = uuid.v4() + fileExt;
            callback(null, newName)
        },
    })
});

export { 
    multerConfig
}