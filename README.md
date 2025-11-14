# Journalism Run!

## Integrantes del Equipo
- Pashnin, Kirill		
- Vera Mackliff, Paula Arlette		
- Garcia Poveda, Moisés		
- Hurtado Gonzalez, Jaume		
- Suarez Bernal, Marcos

## Descripción del Proyecto
Journalism Run! es un juego educativo de mecanografía con una temática periodística única. Los jugadores asumen el rol de periodistas que deben escribir artículos contra reloj, compitiendo entre sí para ser el más rápido y preciso. El juego ofrece diferentes niveles de dificultad y artículos variados para mantener el desafío interesante.

### Características Principales
- **Sistema de Dificultad Progresiva**: Tres niveles de dificultad (fácil, medio, difícil) con textos periodísticos de complejidad creciente
- **Multijugador en Tiempo Real**: Compite contra otros jugadores en salas compartidas
- **Sistema de Puntuación**: Basado en velocidad, precisión y artículos completados
- **Interfaz Periodística**: Diseño inspirado en periódicos clásicos
- **Sistema de Usuarios**: Registro y login para guardar estadísticas
- **Ranking y Estadísticas**: Seguimiento del progreso y comparación con otros jugadores

## Tecnologías Utilizadas
- **Frontend**: Vue.js 3 + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Base de Datos**: MySQL
- **Contenedorización**: Docker + Docker Compose
- **Estilizado**: CSS personalizado con temática periodística

## Enlaces del Proyecto
- **Gestión de Tareas**: [Trello Board](https://trello.com/b/QukMBYql/tr1)
- **Diseño UI/UX**: [Figma Design](https://www.figma.com/file/Dg7MpakC0XpZEBZnV6B95U/Untitled?type=design&node-id=0-1&mode=design)
- **URL de Producción**: [http://journalismr.daw.inspedralbes.cat/](http://journalismr.daw.inspedralbes.cat/)

## Estado del Proyecto
El proyecto se encuentra en fase avanzada de desarrollo con las siguientes características implementadas:
-  Sistema de usuarios (registro/login)
-  Mecánicas básicas del juego
-  Sistema de salas multijugador
-  Base de datos con artículos en diferentes niveles
-  Interfaz de usuario completa
-  Sistema de puntuación y ranking
-  Mejoras en la gestión de usuarios
-  Optimizaciones de rendimiento
-  Despliegue en producción

## Instrucciones de Instalación y Desarrollo

### Requisitos Previos
- Docker y Docker Compose
- Node.js y npm (para desarrollo)

### Configuración del Entorno de Desarrollo
1. Clonar el repositorio
```bash
git clone https://github.com/inspedralbes/tr1-type-racer-royale-grup-4-1.git
cd tr1-type-racer-royale-grup-4-1
```

2. Iniciar los contenedores
```bash
cd game
docker-compose up -d
```

3. Instalar dependencias del frontend (para desarrollo)
```bash
cd frontend
npm install
npm run dev
```

4. Instalar dependencias del backend (para desarrollo)
```bash
cd backend
npm install
```
## BBDD

<img width="1114" height="645" alt="BBDD drawio" src="https://github.com/user-attachments/assets/3c0df38e-e205-48f5-b6d7-5448aa410b94" />

##
El proyecto estará disponible en:
http://journalismr.daw.inspedralbes.cat/

## Documentación Adicional
Para más detalles sobre la arquitectura, API y otros aspectos técnicos, consulta la [carpeta de documentación](./doc/README.md).

## Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.




