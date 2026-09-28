import { type Model, Schema } from 'mongoose';

import type { FolderData } from '@olegpolyakov/documents-core';

export type FolderModel = Model<FolderData>;

const FolderSchema = new Schema<FolderData, FolderModel>({
    name: { type: String, required: true },
    documentIds: { type: [String], default: [] },
    userId: { type: String, required: true, immutable: true }
}, {
    timestamps: true
});

export default FolderSchema;