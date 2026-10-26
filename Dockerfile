# Imagen base ligera de Node.js en Alpine Linux
FROM node:20-alpine

# Establecer directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar serve globalmente para que npx lo ejecute inmediatamente sin descargas en tiempo de ejecución
RUN npm install -g serve

# Copiar todos los archivos estáticos del frontend
COPY . .

# Exponer el puerto por defecto
EXPOSE 3000

# Iniciar con npx serve permitiendo configurar el puerto mediante variable de entorno PORT (por defecto 3000)
CMD ["sh", "-c", "npx serve -s . -l ${PORT:-3000}"]
