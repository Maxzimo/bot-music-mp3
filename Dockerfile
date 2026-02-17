FROM node:22-bullseye

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Crear alias python
RUN ln -s /usr/bin/python3 /usr/bin/python || true

# Carpeta de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto
COPY . .

# Iniciar bot
CMD ["node", "index.js"]
