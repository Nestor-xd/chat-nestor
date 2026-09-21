const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Mapa para asociar cada socket a la información del usuario
const clients = new Map();

/**
 * Difunde un mensaje a todos los clientes conectados.
 * @param {object} payload - Objeto con los datos a enviar serializados en JSON.
 * @param {WebSocket|null} senderWs - Socket del emisor (opcional para excluir o etiquetar).
 */
function broadcast(payload, senderWs = null) {
  const messageString = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

wss.on('connection', (ws) => {
  // Inicializamos datos básicos del cliente
  const clientInfo = {
    username: 'Anónimo'
  };
  clients.set(ws, clientInfo);

  console.log('Nuevo cliente conectado.');

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      switch (parsed.type) {
        case 'join': {
          clientInfo.username = (parsed.username || 'Anónimo').trim();
          broadcast({
            type: 'system',
            content: `${clientInfo.username} se ha unido al chat.`,
            timestamp: new Date().toISOString()
          });
          break;
        }

        case 'message': {
          const text = (parsed.text || '').trim();
          if (!text) return;

          broadcast({
            type: 'message',
            username: clientInfo.username,
            text: text,
            timestamp: new Date().toISOString()
          });
          break;
        }

        default:
          console.warn('Tipo de mensaje no reconocido:', parsed.type);
      }
    } catch (err) {
      console.error('Error al procesar el mensaje entrante:', err.message);
    }
  });

  ws.on('close', () => {
    const username = clientInfo.username;
    clients.delete(ws);
    console.log(`Cliente desconectado: ${username}`);

    broadcast({
      type: 'system',
      content: `${username} ha salido del chat.`,
      timestamp: new Date().toISOString()
    });
  });

  ws.on('error', (err) => {
    console.error('Error en conexión WebSocket:', err.message);
  });
});

console.log(`Servidor WebSocket escuchando en el puerto ${PORT}`);
