// Estado local de la aplicación
let socket = null;
let currentUsername = localStorage.getItem('chat_username') || `Usuario_${Math.floor(1000 + Math.random() * 9000)}`;

// Referencias a elementos del DOM
const messagesContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const usernameInput = document.getElementById('username-input');
const setUsernameBtn = document.getElementById('set-username-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Inicializar interfaz con el usuario actual
usernameInput.value = currentUsername;

// Escapar texto para prevenir vulnerabilidades XSS
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Formatear hora (HH:mm)
function formatTime(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Actualizar el indicador visual de conexión
function setConnectionStatus(connected) {
  if (connected) {
    statusDot.className = 'status-dot online';
    statusText.textContent = 'Conectado';
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
  } else {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Desconectado';
    messageInput.disabled = true;
    sendBtn.disabled = true;
  }
}

// Agregar mensaje de sistema en el contenedor
function renderSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'message-system';
  div.textContent = text;
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Agregar mensaje de usuario en el contenedor
function renderUserMessage({ username, text, timestamp }) {
  const isOutgoing = username === currentUsername;
  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`;

  const safeUsername = escapeHTML(username);
  const safeText = escapeHTML(text);
  const time = formatTime(timestamp);

  bubble.innerHTML = `
    <div class="message-meta">
      <span class="message-sender">${isOutgoing ? 'Tú' : safeUsername}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-text">${safeText}</div>
  `;

  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Iniciar conexión WebSocket con lógica de reconexión
function initWebSocket() {
  const wsUrl = typeof CONFIG !== 'undefined' ? CONFIG.WS_URL : 'ws://localhost:8080';
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    setConnectionStatus(true);
    // Notificar al servidor el nombre de usuario
    socket.send(JSON.stringify({
      type: 'join',
      username: currentUsername
    }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'system') {
        renderSystemMessage(data.content);
      } else if (data.type === 'message') {
        renderUserMessage(data);
      }
    } catch (err) {
      console.error('Error al parsear el mensaje recibido:', err);
    }
  };

  socket.onclose = () => {
    setConnectionStatus(false);
    // Intentar reconectar tras 3 segundos
    setTimeout(initWebSocket, 3000);
  };

  socket.onerror = (err) => {
    console.error('Error de conexión WebSocket:', err);
    socket.close();
  };
}

// Evento para cambiar el nombre de usuario
setUsernameBtn.addEventListener('click', () => {
  const newName = usernameInput.value.trim();
  if (!newName || newName === currentUsername) return;

  currentUsername = newName;
  localStorage.setItem('chat_username', currentUsername);

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'join',
      username: currentUsername
    }));
  }
});

// Evento para enviar mensajes
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    type: 'message',
    text: text
  }));

  messageInput.value = '';
  messageInput.focus();
});

// Iniciar al cargar el script
initWebSocket();
