import { Router } from 'express';

import type { Context } from '@/context';

import Controller from './controller';

export default (context: Context) => {
    const router = Router();
    const { getDocuments, getDocument, createDocument, updateDocument, deleteDocument } = Controller(context);

    router.get('/documents', getDocuments);
    router.get('/documents/:id', getDocument);
    router.post('/documents', createDocument);
    router.put('/documents/:id', updateDocument);
    router.delete('/documents/:id', deleteDocument);

    return router;
};