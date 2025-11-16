# JournalismRace

## Integrants de l'Equip
- Pashnin, Kirill		
- Vera Mackliff, Paula Arlette		
- Garcia Poveda, Moisés		
- Hurtado Gonzalez, Jaume		
- Suarez Bernal, Marcos

## Descripció del Projecte

JournalismRace és un joc educatiu de mecanografia amb temàtica periodística. Els jugadors assumeixen el rol de periodistes que han d'escriure articles contrarellotge, competint entre ells per ser el més ràpid i precís. El joc ofereix diferents nivells de dificultat i articles variats per mantenir el repte interessant.

### Objectius

- Proporcionar una experiència de joc educativa per millorar les habilitats de mecanografia
- Ofereix un sistema multijugador en temps real on els jugadors competeixen entre ells
- Implementar un sistema de puntuació basat en velocitat i precisió
- Crear una interfície d'usuari atractiva amb temàtica periodística
- Gestionar usuaris amb registre, login i estadístiques

### Característiques Principals

- **Sistema de Dificultat Progressiva**: Tres nivells de dificultat (fàcil, mitjà, difícil) amb textos periodístics de complexitat creixent
- **Multijugador en Temps Real**: Competeix contra altres jugadors en sales compartides
- **Sistema de Puntuació**: Basat en velocitat, precisió i articles completats
- **Interfície Periodística**: Disseny inspirat en diaris clàssics
- **Sistema d'Usuaris**: Registre i login per guardar estadístiques
- **Sistema de Diners i Apostes**: Mode "Mort Súbita" amb sistema d'apostes
- **Ranking i Estadístiques**: Seguiment del progrés i comparació amb altres jugadors

## Tecnologies Utilitzades

### Frontend
- **Vue.js 3**: Framework JavaScript per a la interfície d'usuari
- **Vite**: Eina de construcció i desenvolupament
- **Pinia**: Gestió d'estat global
- **Socket.IO Client**: Comunicació en temps real amb el servidor
- **CSS personalitzat**: Variables CSS per temàtica periodística i mode fosc

### Backend
- **Node.js**: Entorn d'execució JavaScript
- **Express.js**: Framework web per a l'API REST
- **Socket.IO**: Comunicació en temps real bidireccional
- **MySQL**: Base de dades relacional
- **Multer**: Gestió de càrrega d'imatges
- **bcrypt**: Encriptació de contrasenyes

### Infraestructura
- **Docker i Docker Compose**: Contenidorització de l'aplicació
- **Nginx**: Servidor web i reverse proxy
- **MySQL 8.0**: Base de dades

## Arquitectura

### Interrelació entre components

1. **Frontend (Vue.js)**: S'executa al navegador i gestiona la interfície d'usuari. Es comunica amb el backend mitjançant:
   - REST API per operacions CRUD (registre, login, imatges, diners)
   - Socket.IO per comunicació en temps real (sales, joc, puntuacions)

2. **Backend (Node.js/Express)**: Gestiona la lògica del servidor:
   - API REST per operacions de base de dades
   - Socket.IO per gestió de sales i joc en temps real
   - Serveix el frontend compilat en producció

3. **Base de Dades (MySQL)**: Emmagatzema:
   - Usuaris (credencials, diners, imatges de perfil)
   - Articles (textos per als diferents nivells de dificultat)
   - Resultats (estadístiques de partides)

4. **Nginx**: Actua com a reverse proxy:
   - Enruta les peticions HTTP al backend
   - Serveix arxius estàtics
   - Gestiona CORS en producció

## Enllaços del Projecte

- **URL de Producció**: [http://journalismr.daw.inspedralbes.cat/](http://journalismr.daw.inspedralbes.cat/)

## Instal·lació i Desenvolupament

### Requisits Previs

- Docker i Docker Compose
- Node.js i npm (per desenvolupament local)

### Configuració de l'Entorn de Desenvolupament

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

## Desplegament a Producció

1. **Configurar variables d'entorn:**
Assegurar-se que el fitxer `.env` està configurat correctament per producció.

2. **Construir i iniciar els contenidors:**
```bash
cd game
docker-compose up -d --build
```

El Dockerfile del backend construeix automàticament el frontend i el copia al directori `dist` del backend. Nginx enruta les peticions al backend que serveix tant l'API com el frontend compilat.

3. **Verificar el desplegament:**
L'aplicació estarà disponible a la URL configurada: `http://journalismr.daw.inspedralbes.cat/`

## API REST - Endpoints

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
- `userId` (paràmetre URL)

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
- `userId` (paràmetre URL)

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
- `userId` (paràmetre URL)

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

## Socket.IO - Esdeveniments Principals

El joc utilitza Socket.IO per a la comunicació en temps real. Alguns esdeveniments principals:

- `register`: Registre d'usuari nou
- `login`: Inici de sessió
- `createRoom`: Creació d'una sala de joc
- `joinRoom`: Unir-se a una sala
- `gameStart`: Inici d'una partida
- `updateRooms`: Actualització de la llista de sales
- `betConfirmed`: Confirmació d'aposta (mode Mort Súbita)
- `moneyUpdated`: Actualització de diners de l'usuari

## Base de Dades

### Esquema

L'esquema de la base de dades inclou:

- **Taula `users`**: Informació d'usuaris (id, username, password, money, imagePath)
- **Taula `articles_easy`, `articles_medium`, `articles_hard`**: Articles per a cada nivell de dificultat
- **Taula `results`**: Resultats de partides (userId, wpm, accuracy, etc.)

### Diagrama de Base de Dades

<img width="1114" height="645" alt="BBDD drawio" src="https://github.com/user-attachments/assets/3c0df38e-e205-48f5-b6d7-5448aa410b94" />

## Estructura del Projecte

```
game/
├── backend/          # Codi del servidor Node.js
│   ├── server.js     # Servidor principal
│   ├── data/         # Dades d'articles
│   └── img/          # Imatges de perfil
├── frontend/         # Codi del client Vue.js
│   ├── src/
│   │   ├── components/   # Components Vue
│   │   ├── stores/       # Pinia stores
│   │   ├── composables/  # Composables Vue
│   │   └── services/     # Serveis (Socket.IO)
│   └── public/       # Arxius estàtics
├── db/              # Scripts d'inicialització de la base de dades
│   └── db_init/     # Scripts SQL
├── nginx/           # Configuració de Nginx
│   └── conf.d/      # Arxius de configuració
└── docker-compose.yml
```

