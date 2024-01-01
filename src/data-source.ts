import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User.js";
import { Image } from "./entity/Image.js";
import { isTesting } from "./utils/misc.js";

export const AppDataSource = new DataSource({
    type: isTesting() ? "better-sqlite3" : "mysql",
    host: process.env.FEDIMG_DB_HOSTNAME || "localhost",
    port: parseInt(process.env.FEDIMG_DB_PORT) || 3306,
    username: process.env.FEDIMG_DB_USER || "test",
    password: process.env.FEDIMG_DB_PWD || "",
    database: process.env.FEDIMG_DB_NAME || "test",
    synchronize: true,
    logging: isTesting() ? false: 'all',
    entities: [User, Image],
    migrations: [],
    subscribers: [],
})
