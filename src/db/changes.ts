import { WebSocket, WebSocketServer } from 'ws';

import type Context from '@/context';

export default ({ models: { Document } }: Context) => (wss: WebSocketServer, clients: WeakMap<WebSocket, string>): WebSocketServer => {
    const models = [Document];
    const pipeline = [{
        $match: { operationType: { $in: ['insert', 'update', 'delete'] } }
    }];
    const options = {
        fullDocument: 'updateLookup', // ensures the full document is returned on updates
        hydrate: true
    };

    models.forEach(model => {
        const changeStream = model.watch(pipeline, options); 

        changeStream.on('change', event => {
            const payload = JSON.stringify({
                model: model.modelName,
                action: event.operationType,
                documentId: event.documentKey._id,
                data: event.fullDocument
            });

            wss.clients.forEach(client => {
                const userId = clients.get(client);

                if (
                    client.readyState === WebSocket.OPEN &&
                    (event.fullDocument.userId === userId ||
                    event.fullDocument.userIds?.includes(userId))
                ) { 
                    client.send(payload);
                }
            });
        });

        changeStream.on('error', error => {
            console.error('Change Stream Error:', error);
        });
    });

    return wss;
};