import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export function getStaticAssetsPath() {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return resolve(__dirname, '../../public')
}