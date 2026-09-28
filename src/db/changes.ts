import { WebSocket, WebSocketServer } from 'ws';

import type Context from '@/context';

export default ({ models: { Document, Folder } }: Context) => (wss: WebSocketServer, clients: WeakMap<WebSocket, string>): WebSocketServer => {
    const models = [Document, Folder];
    const pipeline = [{
        $match: {
            $or: [
                { operationType: { $in: ['insert', 'delete'] } },
                {
                    operationType: 'update',
                    'updateDescription.updatedFields.content': { $exists: false }
                }
            ]
        }
    }];
    const options = {
        fullDocument: 'updateLookup', // ensures the full document is returned on updates
        hydrate: true
    };

    models.forEach(model => {
        const changeStream = model.watch(pipeline, options); 

        changeStream.on('change', event => {
            const data = event.fullDocument;
            const payload = JSON.stringify({
                model: model.modelName,
                action: event.operationType,
                documentId: event.documentKey._id,
                data
            });

            wss.clients.forEach(client => {
                const userId = clients.get(client);

                if (
                    client.readyState === WebSocket.OPEN &&
                    (
                        event.operationType === 'delete' ||
                        data?.userId === userId ||
                        data?.userIds?.includes(userId)
                    )
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