import { getUserId } from '@olegpolyakov/backend/features/auth';
import { Request, Response } from '@olegpolyakov/backend/server';

import type { Context } from '@/context';

export default ({ models: { Document } }: Context) => ({
    async getDocuments(req: Request, res: Response) {
        const userId = getUserId(req);
        const documents = await Document.find({ userId });

        res.status(200).json(documents);
    },

    async getDocument(req: Request, res: Response) {
        const userId = getUserId(req);
        const document = await Document.get({ _id: req.params.id, userId });

        res.status(200).json(document);
    },

    async createDocument(req: Request, res: Response) {
        const userId = getUserId(req);
        const document = await Document.create({ ...req.body, userId });

        res.status(201).json(document);
    },

    async updateDocument(req: Request, res: Response) {
        const userId = getUserId(req);
        const document = await Document.update({ _id: req.params.id, userId }, req.body);

        res.status(200).json(document);
    },

    async deleteDocument(req: Request, res: Response) {
        const userId = getUserId(req);
        await Document.delete({ _id: req.params.id, userId });

        res.status(204).send();
    }
});