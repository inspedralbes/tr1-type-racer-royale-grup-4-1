# Documentació

## Objectius

JournalismRace és un joc educatiu de mecanografia amb temàtica periodística. Els objectius principals són:

- Proporcionar una experiència de joc educativa per millorar les habilitats de mecanografia
- Ofereix un sistema multijugador en temps real on els jugadors competeixen entre ells
- Implementar un sistema de puntuació basat en velocitat i precisió
- Crear una interfície d'usuari atractiva amb temàtica periodística
- Gestionar usuaris amb registre, login i estadístiques

## Arquitectura bàsica

### Tecnologies utilitzades

**Frontend:**
- Vue.js 3 (framework JavaScript)
- Vite (eina de construcció)
- Pinia (gestió d'estat)
- Socket.IO Client (comunicació en temps real)
- CSS personalitzat amb variables per temàtica periodística

**Backend:**
- Node.js (entorn d'execució)
- Express.js (framework web)
- Socket.IO (comunicació en temps real)
- MySQL (base de dades)
- Multer (gestió d'imatges)
- bcrypt (encriptació de contrasenyes)

**Infraestructura:**
- Docker i Docker Compose (contenidorització)
- Nginx (servidor web i reverse proxy)
- MySQL 8.0 (base de dades)

### Interrelació entre els diversos components

1. **Frontend (Vue.js)**: S'executa al navegador i gestiona la interfície d'usuari. Es comunica amb el backend mitjançant:
   - REST API per operacions CRUD (registre, login, imatges, diners)
   - Socket.IO per comunicació en temps real (salas, joc, puntuacions)

2. **Backend (Node.js/Express)**: Gestiona la lògica del servidor:
   - API REST per operacions de base de dades
   - Socket.IO per gestió de salas i joc en temps real
   - Serveix el frontend compilat en producció

3. **Base de dades (MySQL)**: Emmagatzema:
   - Usuaris (credencials, diners, imatges de perfil)
   - Articles (textos per als diferents nivells de dificultat)
   - Resultats (estadístiques de partides)

4. **Nginx**: Actua com a reverse proxy:
   - Enruta les peticions HTTP al backend
   - Serveix arxius estàtics
   - Gestiona CORS en producció

## Com crees l'entorn de desenvolupament

1. **Clonar el repositori:**
```bash
git clone https://github.com/inspedralbes/tr1-type-racer-royale-grup-4-1.git
cd tr1-type-racer-royale-grup-4-1/game
```

2. **Configurar variables d'entorn:**
Crear un fitxer `.env` a la carpeta `game/` amb:
```
DB_NAME=journalismRacer
DB_USER=appuser
DB_PASS=password
DB_ROOT=rootpassword
NODE_ENV=development
```

3. **Iniciar els contenidors Docker:**
```bash
docker-compose up -d
```
Això iniciarà MySQL i Nginx. El backend s'ha d'executar manualment en desenvolupament.

4. **Instal·lar dependències del backend:**
```bash
cd backend
npm install
node server.js
```

5. **Instal·lar dependències del frontend:**
```bash
cd frontend
npm install
npm run dev
```

El frontend estarà disponible a `http://localhost:5173` i el backend a `http://localhost:3000`.

## Com desplegues l'aplicació a producció

1. **Configurar variables d'entorn:**
Assegurar-se que el fitxer `.env` està configurat correctament per producció.

2. **Construir i iniciar els contenidors:**
```bash
cd game
docker-compose up -d --build
```

El Dockerfile del backend construeix automàticament el frontend i el copia al directori `dist` del backend. Nginx enruta les peticions al backend que serveix tant l'API com el frontend compilat.

3. **Verificar el desplegament:**
L'aplicació estarà disponible a la URL configurada (per exemple: `http://journalismr.daw.inspedralbes.cat/`).

## Llistat d'endpoints de l'API de backend

### POST `/api/upload-profile-image`
Puja una imatge de perfil per a un usuari.

**Petició:**
- Content-Type: `multipart/form-data`
- Body: `image` (fitxer), `userId` (string)

**Resposta exitosa (200):**
```json
{
  "ok": true,
  "imagePath": "/img/1234567890-123456789.png"
}
```

**Resposta d'error (400/500):**
```json
{
  "ok": false,
  "message": "No se recibió ninguna imagen"
}
```

### GET `/api/get-profile-image/:userId`
Obté la ruta de la imatge de perfil d'un usuari.

**Paràmetres:**
- `userId` (URL parameter)

**Resposta exitosa (200):**
```json
{
  "ok": true,
  "imagePath": "http://journalismr.daw.inspedralbes.cat/img/default.png"
}
```

**Resposta d'error (404):**
```json
{
  "ok": false,
  "message": "Usuario no encontrado",
  "code": "USER_NOT_FOUND"
}
```

### GET `/api/get-user-info/:userId`
Obté la informació d'un usuari (nom, imatge, diners).

**Paràmetres:**
- `userId` (URL parameter)

**Resposta exitosa (200):**
```json
{
  "ok": true,
  "username": "usuari123",
  "imagePath": "http://journalismr.daw.inspedralbes.cat/img/default.png",
  "money": 1000
}
```

**Resposta d'error (404):**
```json
{
  "ok": false,
  "message": "Usuario no encontrado",
  "code": "USER_NOT_FOUND"
}
```

### GET `/api/get-user-money/:userId`
Obté la quantitat de diners d'un usuari.

**Paràmetres:**
- `userId` (URL parameter)

**Resposta exitosa (200):**
```json
{
  "ok": true,
  "money": 1000
}
```

**Resposta d'error (404):**
```json
{
  "ok": false,
  "message": "Usuario no encontrado",
  "code": "USER_NOT_FOUND"
}
```

### POST `/api/update-user-money`
Actualitza la quantitat de diners d'un usuari.

**Petició:**
```json
{
  "userId": "123",
  "amount": 1500
}
```

**Resposta exitosa (200):**
```json
{
  "ok": true,
  "money": 1500
}
```

**Resposta d'error (400/500):**
```json
{
  "ok": false,
  "message": "userId y amount son requeridos"
}
```

## Altres elements importants

### Events Socket.IO

El joc utilitza Socket.IO per a la comunicació en temps real. Alguns events principals:

- `register`: Registre d'usuari nou
- `login`: Inici de sessió
- `createRoom`: Creació d'una sala de joc
- `joinRoom`: Unir-se a una sala
- `gameStart`: Inici d'una partida
- `updateRooms`: Actualització de la llista de sales
- `betConfirmed`: Confirmació d'aposta (mode Mort Súbita)

### Base de dades

L'esquema de la base de dades inclou:
- Taula `users`: Informació d'usuaris (id, username, password, money, imagePath)
- Taula `articles_easy`, `articles_medium`, `articles_hard`: Articles per a cada nivell de dificultat
- Taula `results`: Resultats de partides (userId, wpm, accuracy, etc.)

### Estructura del projecte

```
game/
├── backend/          # Codi del servidor Node.js
├── frontend/         # Codi del client Vue.js
├── db/              # Scripts d'inicialització de la base de dades
├── nginx/           # Configuració de Nginx
└── docker-compose.yml
```
