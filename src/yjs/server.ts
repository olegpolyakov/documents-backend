import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';

import { setPersistence, setupWSConnection } from '@y/websocket-server/utils';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';

import type { Server } from '@olegpolyakov/backend/server';

import type Context from '@/context';

import { createPersistence } from './persistence';

export default (context: Context, {
    jwtSecret
}: {
    jwtSecret: string;
}) => (server: Server) => {
    const wss = new WebSocketServer({ noServer: true });
    const persistence = createPersistence(context);

    setPersistence(persistence);

    server.http.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        const documentId = getRoomName(request.url);

        if (!documentId) return;

        const userId = getUserId(request, jwtSecret);

        if (!userId) {
            socket.destroy();
            return;
        }

        void persistence.ensure(documentId, userId).then(() => {
            console.log('Ensured persistence for document:', documentId, 'user:', userId);
            wss.handleUpgrade(request, socket, head, connection => {
                console.log('Upgrading connection for document:', documentId, 'user:', userId);
                setupWSConnection(connection, request, { docName: documentId });
            });
        }).catch(error => {
            console.error('Error ensuring persistence:', error);
            socket.destroy();
        });
    });
};

function getRoomName(url = '') {
    const pathname = new URL(url, 'http://localhost').pathname;
    const prefix = '/yjs/';

    if (!pathname.startsWith(prefix)) return null;

    const documentId = decodeURIComponent(pathname.slice(prefix.length));

    return documentId && !documentId.includes('/') ? documentId : null;
}

function getUserId(request: IncomingMessage, jwtSecret: string) {
    const token = new URL(request.url ?? '', 'http://localhost').searchParams.get('token');

    if (!token) return null;

    try {
        const payload = jwt.verify(token, jwtSecret) as { userId?: string };
        return payload.userId ?? null;
    } catch {
        return null;
    }
}