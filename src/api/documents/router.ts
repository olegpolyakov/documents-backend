import { Router } from 'express';

import type { Context } from '@/context';

import Controller from './controller';

export default (context: Context) => {
    const router = Router();
    const {
        getDocuments,
        getDocument,
        createDocument,
        updateDocument,
        deleteDocument
    } = Controller(context);

    router.get('/', getDocuments);
    router.get('/:id', getDocument);
    router.post('/', createDocument);
    router.put('/:id', updateDocument);
    router.delete('/:id', deleteDocument);

    return router;
};