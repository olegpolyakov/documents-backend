import { Models } from './db';

export type Context = {
    config: {
        OLLAMA_TOKEN: string;
        STORAGE_URL: string;
        S3_ACCESS_KEY_ID: string;
        S3_SECRET_ACCESS_KEY: string;
        S3_STORAGE_ENDPOINT: string;
        S3_STORAGE_REGION: string;
        S3_STORAGE_BUCKET: string;
    };
    models: Models;
};

export default Context;