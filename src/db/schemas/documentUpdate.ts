import { type Model, Schema } from 'mongoose';

export type DocumentUpdateData = {
    documentId: string;
    state: Buffer;
};

export type DocumentUpdateModel = Model<DocumentUpdateData>;

const DocumentUpdateSchema = new Schema<DocumentUpdateData, DocumentUpdateModel>({
    documentId: { type: String, required: true, unique: true, immutable: true },
    state: { type: Buffer, required: true }
}, {
    collection: 'updates',
    timestamps: true
});

export default DocumentUpdateSchema;