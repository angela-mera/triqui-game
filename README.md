# Tic-tac-toe Game

Un juego de Tic-tac-toe desarrollado con Node.js y Socket.io, que ofrece una experiencia de juego tanto en modo multijugador como contra la IA.

## Características

- **Modos de Juego**
  - Multijugador en tiempo real
  - Modo single player contra IA
  - Sistema de series de 5 partidas

- **Personalización**
  - Temas visuales (Light, Dark, Neon)
  - Personalización de colores de símbolos

- **Chat en Tiempo Real**
  - Comunicación entre jugadores
  - Mensajes del sistema

- **Sistema de Tiempo**
  - Temporizador por turno
  - Barra de progreso visual
  - Manejo automático de turnos perdidos

- **Sistema de Puntuación**
  - Seguimiento de victorias
  - Tabla de clasificación

## Tecnologías Utilizadas

- **Backend**
  - Node.js
  - Express
  - Socket.io

- **Frontend**
  - HTML5
  - CSS3 (con variables CSS)
  - JavaScript (ES6+)

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor:
```bash
npm start
```

3. Abre tu navegador en:
```
http://localhost:3000
```

## Cómo Jugar

1. Ingresa tu nombre
2. Selecciona el modo de juego:
   - Jugar contra IA
   - Jugar contra otro jugador
3. Personaliza tu experiencia:
   - Elige un tema visual
   - Selecciona el color de tu símbolo
4. ¡Comienza a jugar!

## Temas Disponibles

- **Light**: Tema claro con colores lila suaves
- **Dark**: Tema oscuro para jugar de noche
- **Neon**: Tema vibrante con efectos de brillo

## Configuración del Servidor

El servidor se ejecuta por defecto en el puerto 3000. Puedes modificarlo estableciendo la variable de entorno PORT:

```bash
PORT=3000 npm start
```

## Características de la IA

- Algoritmo Minimax para decisiones óptimas
- Dificultad ajustable
- Movimientos con retraso simulado

## Licencia

Este proyecto está bajo la Licencia ISC.
