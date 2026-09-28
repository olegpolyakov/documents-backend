import { CodeNode } from '@lexical/code';
import { createHeadlessEditor } from '@lexical/headless';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
    createYjsBinding,
    type Provider,
    syncLexicalUpdateToYjs,
    syncYjsChangesToLexical
} from '@lexical/yjs';
import * as Y from 'yjs';

const nodes = [HeadingNode, QuoteNode, ListItemNode, ListNode, CodeNode];

const provider = {
    awareness: {
        getLocalState: () => null,
        getStates: () => new Map(),
        off: () => undefined,
        on: () => undefined,
        setLocalState: () => undefined,
        setLocalStateField: () => undefined
    }
} as unknown as Provider;

/**
 * Creates a Yjs document update from a serialized Lexical editor state.
 * @param content - The serialized Lexical editor state as a JSON string.
 * @returns A promise that resolves to the Yjs update as a Uint8Array.
 */
export async function createYjsState(content: string): Promise<Uint8Array> {
    const doc = new Y.Doc();

    if (!content) {
        return Y.encodeStateAsUpdate(doc);
    }

    const editor = createEditor('documents-yjs-bootstrap');
    const editorState = editor.parseEditorState(JSON.parse(content));
    const binding = createYjsBinding({
        id: 'document',
        editor,
        doc,
        docMap: new Map([['document', doc]])
    });

    editor.registerUpdateListener(({
        dirtyElements,
        dirtyLeaves,
        editorState: nextEditorState,
        normalizedNodes,
        prevEditorState,
        tags
    }) => {
        syncLexicalUpdateToYjs(
            binding,
            provider,
            prevEditorState,
            nextEditorState,
            dirtyElements,
            dirtyLeaves,
            normalizedNodes,
            tags
        );
    });

    editor.setEditorState(editorState);
    await new Promise(resolve => setTimeout(resolve, 0));

    return Y.encodeStateAsUpdate(doc);
}

/**
 * Creates a Lexical editor state from a Yjs document.
 * @param doc - The Yjs document to project into the Lexical editor state.
 * @returns A promise that resolves to the serialized Lexical editor state as a JSON string.
 */
export async function createLexicalState(doc: Y.Doc): Promise<string> {
    const editor = createEditor('documents-yjs-projection');
    const projectionDoc = new Y.Doc();
    const binding = createYjsBinding({
        id: 'document',
        editor,
        doc: projectionDoc,
        docMap: new Map([['document', projectionDoc]])
    });

    binding.root.getSharedType().observeDeep(events => {
        syncYjsChangesToLexical(binding, provider, events, false);
    });

    Y.applyUpdate(projectionDoc, Y.encodeStateAsUpdate(doc));
    await new Promise(resolve => setTimeout(resolve, 0));

    return JSON.stringify(editor.getEditorState().toJSON());
}

function createEditor(namespace: string) {
    return createHeadlessEditor({
        namespace,
        nodes,
        onError: error => {
            throw error;
        }
    });
}