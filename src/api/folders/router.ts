import { Router } from 'express';

import type { Context } from '@/context';

import Controller from './controller';

export default (context: Context) => {
    const router = Router();
    const {
        getFolders,
        getFolder,
        createFolder,
        updateFolder,
        deleteFolder
    } = Controller(context);

    router.get('/', getFolders);
    router.get('/:id', getFolder);
    router.post('/', createFolder);
    router.put('/:id', updateFolder);
    router.delete('/:id', deleteFolder);

    return router;
};