import { auth } from '@olegpolyakov/backend/features/auth';
import Server from '@olegpolyakov/backend/server';
import Ws from '@olegpolyakov/backend/server/ws';

import Api from './api';
import type Context from './context';
import Db from './db';
import DbChanges from './db/changes';

const {
    DOMAIN = '',
    HOST = 'localhost',
    PORT = 3000,
    DB_CONNECTION_STRING = '',
    COOKIE_SECRET = '',
    JWT_SECRET = '',
    OLLAMA_TOKEN = '',
    S3_ACCESS_KEY_ID = '',
    S3_SECRET_ACCESS_KEY = '',
    S3_STORAGE_ENDPOINT = '',
    S3_STORAGE_REGION = '',
    S3_STORAGE_BUCKET = ''
} = process.env;

const db = Db(DB_CONNECTION_STRING, { debug: true });

await db.connect();

const context: Context = {
    config: {
        OLLAMA_TOKEN,
        STORAGE_URL: '',
        S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY,
        S3_STORAGE_ENDPOINT,
        S3_STORAGE_REGION,
        S3_STORAGE_BUCKET
    },
    models: db.models
};

Server({
    host: HOST,
    port: PORT,
    cookies: {
        secret: COOKIE_SECRET
    },
    cors: {
        domain: DOMAIN
    },
    json: true
})
    .use(auth({ jwtSecret: JWT_SECRET }))
    .use('/api', Api(context))
    .plugin(Ws({ path: '/ws' }, [DbChanges(context)]))
    .start(() => {
        console.info(`Server is running on ${HOST}:${PORT}`);
    });