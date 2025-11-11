<template>
  <div class="first-page">
    <div
      v-if="isNewspaperVisible"
      :class="['newspaper-layer', { 'hidden-content': !isNewspaperVisible }]"
    >
      <img
        src="@/img/jhorunalismpaper.png"
        alt="Portada de Journalism Race"
        class="newspaper-image"
      />
      <button class="contract-overlay" @click="fillContract">Omplir contracte</button>
      <button class="login-overlay" @click="openBadge">Entrar a l'oficina</button>
    </div>

    <Transition name="badge-slide">
      <div v-if="isBadgeVisible" class="badge-wrapper">
        <div class="badge-content">
          <img
            src="@/img/carnetid.png"
            alt="Carnet identificatiu"
            class="badge-image"
          />

          <form class="badge-form" @submit.prevent="submitLogin">
            <input
              id="badge-username"
              class="badge-input"
              type="text"
              v-model="username"
              autocomplete="username"
              placeholder="Escriu el teu usuari"
            />

            <input
              id="badge-password"
              class="badge-input"
              type="text"
              v-model="password"
              autocomplete="current-password"
              placeholder="Escriu la contrasenya"
            />
          </form>
        </div>

        <button
          type="button"
          class="badge-submit"
          :disabled="isSubmitting"
          @click="submitLogin"
        >
          <i class="fas fa-angle-right"></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
// import Config from "./Config.vue";
import SocketManager from "../../services/socketManager";
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(['lobby']);
const gameStore = useGameStore();
const sm = new SocketManager();

const isNewspaperVisible = ref(true);
const isBadgeVisible = ref(false);
const username = ref('');
const password = ref('');
const isSubmitting = ref(false);

const loginResultHandler = (res) => {
  isSubmitting.value = false;

  if (res?.ok) {
    const cleanUsername = username.value.trim();
    gameStore.setUserId(res.userId);
    if (cleanUsername) {
      gameStore.setUsername(cleanUsername);
      sm.emit('saveUsername', cleanUsername);
    }

    isBadgeVisible.value = false;
    isNewspaperVisible.value = true;
    username.value = '';
    password.value = '';

    emit('lobby');
  } else {
    console.warn('Error de login:', res?.code || 'desconegut');
  }
};

onMounted(() => {
  if (!sm.socket) sm.connect();
  sm.on('loginResult', loginResultHandler);
});

function doRegister() {
  const username = prompt('Usuario:');
  const password = prompt('Contraseña:');
  if (!username || !password) return;

  sm.on('registerResult', (res) => {
    if (res.ok) {
      gameStore.setUserId(res.userId);
      gameStore.setUsername(res.username);
      gameStore.fetchUserMoney();
      console.log('Usuario registrado:', res.username, 'con ID:', res.userId);
      sm.callbacks['registerResult'] = undefined;
      emit('lobby');
    } else {
      alert(`Error: ${res.code}`);
      sm.callbacks['registerResult'] = undefined;
    }
  });
  sm.emit('register', { username, password });
}

function doLogin() {
  const username = prompt('Usuario:');
  const password = prompt('Contraseña:');
  if (!username || !password) return;

  sm.on('loginResult', (res) => {
    if (res.ok) {
      gameStore.setUserId(res.userId);
      gameStore.setUsername(res.username);
      gameStore.fetchUserMoney();
      console.log('Usuario logueado:', res.username, 'con ID:', res.userId);
      sm.callbacks['loginResult'] = undefined;
      emit('lobby');
    } else {
      alert(`Error: ${res.code}`);
      sm.callbacks['loginResult'] = undefined;
    }
  });
  sm.emit('login', { username, password });
onBeforeUnmount(() => {
  if (sm.callbacks['loginResult'] === loginResultHandler) {
    delete sm.callbacks['loginResult'];
  }
});

function openBadge() {
  isNewspaperVisible.value = false;
  isBadgeVisible.value = true;
  isSubmitting.value = false;
  username.value = gameStore.username || '';
  password.value = '';
}

function submitLogin() {
  const user = username.value.trim();
  const pass = password.value.trim();

  if (!user || !pass) {
    console.warn('Campos incompletos en el formulario de acceso');
    return;
  }

  isSubmitting.value = true;
  sm.emit('login', { username: user, password: pass });
}

function fillContract() {
  alert('¡Contrato en construcción! Próximamente podrás completarlo.');
}
</script>

<style scoped>
/* Se importa la nueva fuente para el look moderno */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');

.first-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 4rem;
  position: relative; /* Necesario para los elementos con position: absolute */
  overflow: hidden; /* Evita que las animaciones se salgan de la pantalla */

  /* Fondo con imagen */
  background: url('@/img/fondo.png') no-repeat center center fixed;
  background-size: cover;
  font-family: 'Poppins', sans-serif;
  color: #333;
  text-align: center;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.newspaper-layer {
  position: relative;
  width: 100%;
  height: 100%;
}

.hidden-content {
  display: none !important;
}

/* --- ANIMACIONES Y EFECTOS VISUALES ORIGINALES (COLORES ADAPTADOS) --- */

/* Efecto de líneas de escaneo CRT */
.scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04) 0px, /* Más sutil para el fondo claro */
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.04) 3px
  );
  animation: scanlineMove 8s linear infinite;
  z-index: 10;
}

@keyframes scanlineMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* Contenedor del título con animación de glitch */
.title-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: glitchContainer 5s infinite;
}

@keyframes glitchContainer {
  0%, 90%, 100% { transform: translate(0, 0); }
  91% { transform: translate(-2px, 1px); }
  92% { transform: translate(2px, -1px); }
  93% { transform: translate(-1px, 2px); }
  94% { transform: translate(1px, -2px); }
}

/* --- TÍTULO: FUSIÓN DE ESTILOS Y ANIMACIONES --- */

.title {
  font-size: 6rem;
  font-weight: 900;
  margin: 0;
  display: flex;
  flex-direction: column;
  line-height: 1;
  text-transform: uppercase;
  /* Animaciones originales */
  animation: titleGlitch 3s infinite, titleFloat 4s ease-in-out infinite;
}

/* Sombras de texto adaptadas a la nueva paleta de colores */
.word {
  display: block;
  animation: wordBlink 2s ease-in-out infinite;
}

.word-1 {
  color: #fff; /* Texto blanco */
  text-shadow: 
    -1px -1px 0 #000,
     0   -1px 0 #000,
     1px -1px 0 #000,
     1px  0   0 #000,
     1px  1px 0 #000,
     0    1px 0 #000,
    -1px  1px 0 #000,
    -1px  0   0 #000,
    0 0 10px rgba(0,0,0,0.5); /* Sombra suave para mejor contraste */
  font-weight: 900;
}

.word-2 {
  color: #FFD700; /* Dorado para mejor visibilidad */
  text-shadow: 
    -2px -2px 0 #000,
     0   -2px 0 #000,
     2px -2px 0 #000,
     2px  0   0 #000,
     2px  2px 0 #000,
     0    2px 0 #000,
    -2px  2px 0 #000,
    -2px  0   0 #000,
    0 0 15px rgba(0,0,0,0.7); /* Sombra más pronunciada */
  font-weight: 900;
  /* Mantener animaciones */
  animation: wordBlink 2s ease-in-out infinite 0.5s, wordShake 0.3s ease-in-out infinite 3s;
}

.subtitle {
  font-size: 1.2rem;
  color: #888;
  margin-top: 1rem;
  font-weight: 400;
}

/* Keyframes de animación del título original */
@keyframes titleGlitch {
  /* Este efecto es sutil y se puede mantener tal cual */
  0%, 85%, 100% { transform: skew(0deg); }
  86% { transform: skew(-1deg); }
  88% { transform: skew(1deg); }
  90% { transform: skew(0deg); }
}

@keyframes titleFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes wordBlink {
  0%, 98%, 100% { opacity: 1; }
  99% { opacity: 0.8; }
}

@keyframes wordShake {
  0%, 90%, 100% { transform: translateX(0); }
  92%, 96% { transform: translateX(-1.5px); }
  94%, 98% { transform: translateX(1.5px); }
}

/* Estrellas pixel art con colores adaptados */
.pixel-stars {
  position: absolute;
  width: 120%;
  height: 120%;
  pointer-events: none;
}

.pixel-star {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #FFA500; /* Naranja */
  box-shadow: 
    0 0 10px #FFA500,
    inset 0 0 5px #ffffff;
  animation: pixelStarBlink 1.5s ease-in-out infinite;
}

.pixel-star:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.pixel-star:nth-child(2) { top: 20%; right: 15%; animation-delay: 0.3s; }
.pixel-star:nth-child(3) { top: 70%; left: 15%; animation-delay: 0.6s; }
.pixel-star:nth-child(4) { top: 80%; right: 20%; animation-delay: 0.9s; }
.pixel-star:nth-child(5) { top: 30%; left: 5%; animation-delay: 0.2s; }
.pixel-star:nth-child(6) { top: 50%; right: 10%; animation-delay: 0.5s; }
.pixel-star:nth-child(7) { top: 15%; left: 85%; animation-delay: 0.8s; }
.pixel-star:nth-child(8) { top: 65%; left: 80%; animation-delay: 0.4s; }

@keyframes pixelStarBlink {
  0%, 50%, 100% { 
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  25% { 
    opacity: 0.3;
    transform: scale(1.3) rotate(45deg);
  }
  75% { 
    opacity: 0.5;
    transform: scale(0.8) rotate(-45deg);
  }
}

/* --- BOTÓN: FUSIÓN DE ESTILO Y ANIMACIÓN --- */

.play-button {
  padding: 1rem 3.5rem;
  font-size: 1.2rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  color: #ffffff;
  background-color: #FF8C00;
  border: none;
  border-radius: 50px; /* Estilo base del nuevo diseño */
  cursor: pointer;
  position: relative; /* Requerido para las animaciones internas */
  overflow: hidden;   /* Requerido para las animaciones internas */
  text-transform: uppercase;
  letter-spacing: 1.5px;
  /* Sombra animada adaptada del original */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: buttonPulse 1.5s ease-in-out infinite;
}

@keyframes buttonPulse {
  0%, 100% { 
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  50% { 
    box-shadow: 0 6px 25px rgba(255, 140, 0, 0.5); /* Pulso de color naranja */
  }
}

/* Borde animado del botón original */
.pixel-border {
  position: absolute;
  inset: 2px; /* Ajustado para el botón redondeado */
  border-radius: 50px;
  border: 2px dashed #FFA500;
  animation: borderDash 1s linear infinite;
}

@keyframes borderDash {
  0% { border-color: #FFA500; }
  50% { border-color: #ffffff; }
  100% { border-color: #FFA500; }
}

/* Texto del botón con su propia animación */
.button-text {
  position: relative;
  z-index: 2;
  display: inline-block;
  animation: textGlow 1.5s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% { text-shadow: 0 0 5px #fff; }
  50% { text-shadow: 0 0 20px #fff; }
}

/* Capa de pixeles animados del botón original */
.button-pixels {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.2) 3px,
    rgba(255, 255, 255, 0.2) 6px
  );
  animation: pixelScan 1.2s linear infinite;
}

@keyframes pixelScan {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Efectos hover y active combinados */
.play-button:hover {
  background-color: #FFA500;
  transform: translateY(-5px) translateX(-2px); /* Movimiento original */
  box-shadow: 0 8px 30px rgba(255, 140, 0, 0.6);
}

.play-button:hover .button-text {
  animation: textFlicker 0.1s ease-in-out infinite;
}

@keyframes textFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}

.play-button:active {
  transform: translateY(2px) translateX(1px); /* Movimiento original */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* --- RESPONSIVE DESIGN --- */
@media (max-width: 768px) {
  .title {
    font-size: 4rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .play-button {
    padding: 0.8rem 2.5rem;
    font-size: 1rem;
  }
  
  .pixel-star {
    width: 8px;
    height: 8px;
  }
}
.newspaper-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  z-index: 5;
  opacity: 0;
  animation: riseUpCentered 0.8s ease-out forwards;
}

.login-overlay {
  position: absolute;
  width: 30vw;
  max-width: 380px;
  min-width: 220px;
  height: 4.5rem;
  top: 83%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(93, 60, 28, 0.95);
  border: none;
  border-radius: 2.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #f7efdc;
  cursor: pointer;
  box-shadow: 0 12px 25px rgba(93, 61, 28, 0.186);
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  z-index: 6;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 0;
  animation: riseUpCentered 0.8s ease-out forwards;
}

.login-overlay:hover {
  transform: translate(-50%, -50%) scale(1.03);
  box-shadow: 0 18px 32px rgba(93, 61, 28, 0.264);
}

.login-overlay:active {
  transform: translate(-50%, -50%) scale(0.98);
  box-shadow: 0 8px 18px rgba(93, 60, 28, 0.35);
}

.contract-overlay {
  position: absolute;
  width: 22vw;
  max-width: 260px;
  min-width: 180px;
  height: 3.8rem;
  top: 40%;
  left: 34%;
  transform: translate(-50%, -50%) rotate(-7deg);
  background: rgba(255, 224, 86, 0.92);
  border: none;
  border-radius: 1.2rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #7a5217;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  z-index: 6;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 0;
  animation: riseUpStick 0.8s ease-out forwards;
}

.contract-overlay:hover {
  transform: translate(-50%, -50%) rotate(-7deg) scale(1.04);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
}

.contract-overlay:active {
  transform: translate(-50%, -50%) rotate(-7deg) scale(0.98);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

@keyframes riseUpCentered {
  0% {
    transform: translate(-50%, 10%);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}

@keyframes riseUpStick {
  0% {
    transform: translate(-50%, -20%) rotate(-7deg);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) rotate(-7deg);
    opacity: 1;
  }
}

.badge-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 0;
}

.badge-content {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.badge-image {
  width: clamp(460px, 70vw, 620px);
  max-height: 100vh;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.28));
  transform: translateY(-40px);
}

.badge-form {
  position: absolute;
  top: 78%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: clamp(220px, 32vw, 340px);
}

.badge-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #5d3c1c;
  text-align: left;
}

.badge-input {
  padding: 0.7rem 0.9rem;
  border: 2px solid #5d3c1c;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.92);
  font-size: 1rem;
  color: #5d3c1c;
  width: 58%;
  margin-bottom: 10%;
  transform: translate(20%, -50%);

}

.badge-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(93, 60, 28, 0.25);
}

.badge-error {
  margin: 0.25rem 0 0;
  color: #c0392b;
  font-weight: 600;
  text-align: center;
}

.badge-submit {
  position: absolute;
  right: clamp(40px, 10vw, 120px);
  top: 55%;
 
  transform: translateX(-300%);
  width: clamp(60px, 8vw, 90px);
  height: clamp(60px, 8vw, 90px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #8BA59B;
  color: #f7efdc;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12px 22px rgba(93, 60, 28, 0.32);
}


.badge-submit i {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 900;
  line-height: 1;
}

.badge-slide-enter-active,
.badge-slide-leave-active {
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.badge-slide-enter-from,
.badge-slide-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

.badge-slide-enter-to,
.badge-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>

