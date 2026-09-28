import { getUserId } from '@olegpolyakov/backend/features/auth';
import { Request, Response } from '@olegpolyakov/backend/server';

import type { Context } from '@/context';

export default ({ models: { Folder } }: Context) => ({
    async getFolders(req: Request, res: Response) {
        const userId = getUserId(req);
        const folders = await Folder.find({ userId });

        res.status(200).json(folders);
    },

    async getFolder(req: Request, res: Response) {
        const userId = getUserId(req);
        const folder = await Folder.get({ _id: req.params.id, userId });

        res.status(200).json(folder);
    },

    async createFolder(req: Request, res: Response) {
        const userId = getUserId(req);
        const folder = await Folder.create({ ...req.body, userId });

        res.status(201).json(folder);
    },

    async updateFolder(req: Request, res: Response) {
        const userId = getUserId(req);
        const folder = await Folder.update({ _id: req.params.id, userId }, req.body);

        res.status(200).json(folder);
    },

    async deleteFolder(req: Request, res: Response) {
        const userId = getUserId(req);
        await Folder.delete({ _id: req.params.id, userId });

        res.status(204).send();
    }
});