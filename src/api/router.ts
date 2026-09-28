import { Router } from 'express';

import type { Context } from '@/context';

import documents from './documents';
import folders from './folders';

export default (context: Context) => {
    const router = Router();

    router.use('/documents', documents(context));
    router.use('/folders', folders(context));

    return router;
};