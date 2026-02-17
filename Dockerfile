FROM node:22-bullseye

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-distutils \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Forzar python -> python3.11
RUN ln -sf /usr/bin/python3.11 /usr/bin/python && \
    ln -sf /usr/bin/python3.11 /usr/bin/python3

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
