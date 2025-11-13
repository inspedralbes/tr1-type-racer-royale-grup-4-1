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
      <button class="contract-overlay" @click="gameStore.playClickSound(); fillContract()">Omplir contracte</button>
      <button class="btn btn-primary login-overlay" @click="gameStore.playClickSound(); openBadge()">Entrar a l'oficina</button>
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
              :disabled="isSubmitting"
            />

            <input
              id="badge-password"
              class="badge-input"
              type="password"
              v-model="password"
              autocomplete="current-password"
              placeholder="Escriu la contrasenya"
              :disabled="isSubmitting"
            />
          </form>
        </div>

        <button
          type="button"
          class="badge-submit"
          :disabled="isSubmitting"
          @click="gameStore.playClickSound(); submitLogin()"
        >
          <i class="fas fa-angle-right"></i>
        </button>
      </div>
    </Transition>

    <Transition name="badge-slide">
      <div v-if="isRegisterVisible" class="badge-wrapper">
        <div class="badge-content">
          <img
            src="@/img/carnetid.png"
            alt="Contracte de registre"
            class="badge-image"
          />

          <form class="badge-form" @submit.prevent="submitRegister">
            <input
              id="register-username"
              class="badge-input"
              type="text"
              v-model="registerUsername"
              autocomplete="username"
              placeholder="Escriu el teu usuari"
              :disabled="isSubmitting"
            />

            <input
              id="register-password"
              class="badge-input"
              type="password"
              v-model="registerPassword"
              autocomplete="new-password"
              placeholder="Escriu la contrasenya"
              :disabled="isSubmitting"
            />
          </form>
        </div>

        <button
          type="button"
          class="badge-submit"
          :disabled="isSubmitting"
          @click="gameStore.playClickSound(); submitRegister()"
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
const isRegisterVisible = ref(false);
const username = ref('');
const password = ref('');
const registerUsername = ref('');
const registerPassword = ref('');
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

    console.log('✅ Login exitoso:', cleanUsername);
    emit('lobby');
  } else {
    console.warn('❌ Error de login:', res?.code || 'desconocido');
  }
};

const registerResultHandler = (res) => {
  isSubmitting.value = false;

  if (res?.ok) {
    const cleanUsername = registerUsername.value.trim();
    gameStore.setUserId(res.userId);
    if (cleanUsername) {
      gameStore.setUsername(cleanUsername);
      sm.emit('saveUsername', cleanUsername);
    }

    isRegisterVisible.value = false;
    isNewspaperVisible.value = true;
    registerUsername.value = '';
    registerPassword.value = '';

    console.log('✅ Registro exitoso:', cleanUsername);
    emit('lobby');
  } else {
    console.warn('❌ Error de registro:', res?.code || 'desconocido');
  }
};

onMounted(() => {
  if (!sm.socket) sm.connect();
  sm.on('loginResult', loginResultHandler);
  sm.on('registerResult', registerResultHandler);
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
}

onBeforeUnmount(() => {
  if (sm.callbacks['loginResult'] === loginResultHandler) {
    delete sm.callbacks['loginResult'];
  }
  if (sm.callbacks['registerResult'] === registerResultHandler) {
    delete sm.callbacks['registerResult'];
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
    console.warn('⚠️ Campos incompletos en el formulario de acceso');
    return;
  }

  isSubmitting.value = true;
  console.log('🔄 Intentando login con usuario:', user);
  sm.emit('login', { username: user, password: pass });
}

function fillContract() {
  isNewspaperVisible.value = false;
  isRegisterVisible.value = true;
  isSubmitting.value = false;
  registerUsername.value = '';
  registerPassword.value = '';
}

function submitRegister() {
  const user = registerUsername.value.trim();
  const pass = registerPassword.value.trim();

  if (!user || !pass) {
    console.warn('⚠️ Campos incompletos en el formulario de registro');
    return;
  }

  if (pass.length < 4) {
    console.warn('⚠️ Contraseña demasiado corta en el formulario de registro');
    return;
  }

  isSubmitting.value = true;
  console.log('🔄 Intentando registrar usuario:', user);
  sm.emit('register', { username: user, password: pass });
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

.first-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: url('@/img/fondo.png') no-repeat center center fixed;
  background-size: cover;
  font-family: 'Poppins', sans-serif;
  color: var(--text-primary);
  width: 100%;
  height: 100vh;
}

.newspaper-layer {
  position: relative;
  width: 100%;
  height: 100%;
}

.hidden-content {
  display: none !important;
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
  width: clamp(220px, 30vw, 360px);
  height: 4.5rem;
  top: 83%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: "Playfair Display", serif;
  z-index: 6;
  opacity: 0;
  animation: riseUpCentered 0.8s ease-out forwards;
}

.login-overlay:hover {
  transform: translate(-50%, -50%) translateY(-4px);
}

.login-overlay:active {
  transform: translate(-50%, -50%) translateY(1px);
}

.login-overlay:disabled {
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: not-allowed;
}

.contract-overlay {
  position: absolute;
  width: clamp(180px, 24vw, 240px);
  height: 3.6rem;
  top: 40%;
  left: 34%;
  transform: translate(-50%, -50%) rotate(-7deg);
  background: color-mix(in srgb, var(--bg-card) 75%, var(--color-secondary) 25%);
  color: color-mix(in srgb, var(--color-primary) 85%, var(--text-white) 15%);
  font-family: "Playfair Display", serif;
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-xl);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  z-index: 6;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  opacity: 0;
  animation: riseUpStick 0.8s ease-out forwards;
  animation-delay: 0.1s;
}

.contract-overlay:hover {
  transform: translate(-50%, -50%) rotate(-7deg) translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.contract-overlay:disabled {
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: not-allowed;
}

@keyframes riseUpCentered {
  0% {
    opacity: 0;
    transform: translate(-50%, 20%);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes riseUpStick {
  0% {
    opacity: 0;
    transform: translate(-50%, -30%) rotate(-7deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(-7deg);
  }
}

.badge-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(1rem, 4vw, 3rem);
  padding: clamp(1rem, 5vw, 4rem);
  z-index: 20;
}

.badge-content {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateY(-6vh);
}

.badge-image {
  width: clamp(420px, 58vw, 640px);
  max-height: 100vh;
  object-fit: contain;
  filter: drop-shadow(0 24px 40px rgba(0, 0, 0, 0.28));
}

.badge-form {
  position: absolute;
  top: 80%;
  left: 46%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: clamp(0.35rem, 1.2vw, 0.75rem);
  width: clamp(80px, 28vw, 200px);
}

.badge-input {
  width: 100%;
  padding: clamp(0.6rem, 1.3vw, 0.85rem);
  border-radius: var(--radius-lg);
  border: 2px solid color-mix(in srgb, var(--color-primary) 65%, var(--bg-body) 35%);
  background: var(--bg-input);
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  color: var(--color-primary);
  outline: none;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.badge-input:focus {
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-sm);
}

.badge-input::placeholder {
  color: color-mix(in srgb, var(--color-primary) 70%, var(--bg-body) 30%);
}

.badge-submit {
  position: absolute;
  right: clamp(28px, 7vw, 84px);
  top: 48%;
  transform: translateX(-260%);
  width: clamp(46px, 5.5vw, 70px);
  height: clamp(46px, 5.5vw, 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  color: var(--text-white);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base), background var(--transition-base);
  box-shadow: var(--shadow-lg);
}

.badge-submit:hover {
  transform: translateX(-260%) translateY(-4px);
  background: color-mix(in srgb, var(--color-secondary) 70%, var(--text-white) 30%);
}

.badge-submit:disabled {
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

.badge-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge-submit:hover:not(:disabled) {
  transform: translateX(-260%) scale(1.05);
  box-shadow: 0 16px 28px rgba(93, 60, 28, 0.4);
}

.badge-submit:active:not(:disabled) {
  transform: translateX(-260%) scale(0.95);
}

.badge-submit i {
  font-size: clamp(1.4rem, 3vw, 2rem);
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

@media (max-width: 768px) {
  .login-overlay {
    top: 85%;
  }

  .contract-overlay {
    top: 42%;
    left: 38%;
  }
}
</style>

