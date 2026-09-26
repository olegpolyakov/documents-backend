import { type Model, Schema } from 'mongoose';

import type { DocumentData } from '@olegpolyakov/documents-core';

export type DocumentModel = Model<DocumentData>;

const DocumentSchema = new Schema<DocumentData, DocumentModel>({
    title: { type: String, required: true },
    content: { type: String, default: '' },
    userId: { type: String, required: true, immutable: true }
}, {
    timestamps: true
});

export default DocumentSchema;