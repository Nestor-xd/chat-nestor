// Configuración de conexión del cliente WebSocket
const CONFIG = {
  WS_HOST: 'localhost',
  WS_PORT: 8080,
  get WS_URL() {
    return `ws://${this.WS_HOST}:${this.WS_PORT}`;
  }
};
