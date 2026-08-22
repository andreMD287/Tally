FROM node:22-slim

WORKDIR /app

# Instalar dependencias del sistema requeridas para sharp y aceleración gráfica
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Generar dataset determinístico por defecto
RUN npm run gen:dataset

EXPOSE 3000

CMD ["npm", "run", "ui"]
