# Imagen base ligera de Node.js en Alpine Linux
FROM node:20-alpine

# Establecer directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --only=production

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto del servidor WebSocket
EXPOSE 8080

# Comando para iniciar el servidor
CMD ["node", "server.js"]
