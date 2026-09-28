import type { WSSharedDoc } from '@y/websocket-server/utils';
import * as Y from 'yjs';

import type Context from '@/context';

import { createLexicalState, createYjsState } from './editor';

const pendingStates = new Map<string, Uint8Array>();

export function createPersistence({ models }: Context) {
    return {
        provider: null,

        async ensure(documentId: string, userId: string) {
            const state = await loadDocumentState(documentId, userId, models);
            pendingStates.set(documentId, state);
        },

        bindState(documentId: string, doc: WSSharedDoc) {
            const state = pendingStates.get(documentId);

            if (state) {
                Y.applyUpdate(doc as unknown as Y.Doc, state);
            }

            doc.on('update', () => scheduleWrite(documentId, doc as unknown as Y.Doc, models));
        },

        async writeState(documentId: string, doc: WSSharedDoc) {
            await flushWrite(documentId, doc as unknown as Y.Doc, models);
            pendingStates.delete(documentId);
        }
    };
}

async function loadDocumentState(documentId: string, userId: string, models: Context['models']) {
    const document = await models.Document.findOne({ _id: documentId });

    if (!document) {
        throw new Error('Document not found');
    }

    const existing = await models.DocumentUpdate.findOne({ documentId });

    if (existing) {
        const state = new Uint8Array(existing.state);

        if (isCompatibleState(state) || !document.content) {
            return state;
        }
    }

    const state = await createYjsState(document.content);

    try {
        await models.DocumentUpdate.create({
            documentId,
            state: Buffer.from(state)
        });
    } catch (error) {
        const concurrent = await models.DocumentUpdate.findOne({ documentId });

        if (!concurrent) {
            throw error;
        }

        const concurrentState = new Uint8Array(concurrent.state);

        if (isCompatibleState(concurrentState) || !document.content) {
            return concurrentState;
        }

        await models.DocumentUpdate.updateOne(
            { documentId },
            { $set: { state: Buffer.from(state) } }
        );

        return state;
    }

    return state;
}

function isCompatibleState(state: Uint8Array) {
    const doc = new Y.Doc();
    const root = doc.get('root', Y.XmlText);

    try {
        Y.applyUpdate(doc, state);
    } catch {
        return false;
    }

    return root instanceof Y.XmlText && root.length > 0;
}

const writeChains = new Map<string, Promise<void>>();

function queueWrite(documentId: string, doc: Y.Doc, models: Context['models']) {
    const previous = writeChains.get(documentId) ?? Promise.resolve();
    const next = previous.then(async () => {
        const state = Buffer.from(Y.encodeStateAsUpdate(doc));

        await models.DocumentUpdate.updateOne(
            { documentId },
            { $set: { state } },
            { upsert: true }
        );

        const content = await createLexicalState(doc);

        await models.Document.update(
            { _id: documentId },
            { content }
        );
    });

    writeChains.set(documentId, next);

    return next.finally(() => {
        if (writeChains.get(documentId) === next) {
            writeChains.delete(documentId);
        }
    });
}

const writeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleWrite(documentId: string, doc: Y.Doc, models: Context['models']) {
    const currentTimer = writeTimers.get(documentId);

    if (currentTimer) {
        clearTimeout(currentTimer);
    }

    writeTimers.set(documentId, setTimeout(() => {
        writeTimers.delete(documentId);
        void queueWrite(documentId, doc, models).catch(error => {
            console.error('Error persisting document:', documentId, error);
        });
    }, 1000));
}

async function flushWrite(documentId: string, doc: Y.Doc, models: Context['models']) {
    const currentTimer = writeTimers.get(documentId);

    if (currentTimer) {
        clearTimeout(currentTimer);
        writeTimers.delete(documentId);
    }

    await queueWrite(documentId, doc, models);
}