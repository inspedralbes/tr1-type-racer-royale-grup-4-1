<template>
  <div>
    <!-- Botón para abrir el popup -->
    <button class="config-button" aria-label="Configuración" @click="isOpen = true">
      <i class="fa-solid fa-gear"></i>
    </button>

    <!-- Popup -->
    <div v-if="isOpen" class="overlay" @click="isOpen = false">
      <div class="popup" @click.stop>
        <button class="close-button" @click="isOpen = false">×</button>

        <h3 class="heading">Configuración Usuario</h3>

        <!-- Foto de usuario -->
        <div class="user-photo" @click="openFileSelector">
          <img :src="profileImage" alt="Usuario" />
          <div class="loading-overlay" v-if="isUploading">
            <div class="spinner"></div>
          </div>
          <div class="hover-text" v-if="!isUploading">
            <i class="fa-solid fa-camera"></i>
          </div>
        </div>

        <!-- Input oculto para seleccionar archivo -->
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          style="display: none"
        />

        <!-- Nombre -->
        <h2 class="nombre">{{ username || 'Jugador' }}</h2>

        <div class="buttons">
          <button class="btn" @click="openFileSelector">Cambiar foto</button>
          <button class="btn" @click="changeUsername">Cambiar nombre</button>
        </div>

        <!-- Mensaje de error/éxito -->
        <div v-if="uploadMessage" :class="['message', uploadMessageType]">
          {{ uploadMessage }}
        </div>

        <!-- Estadísticas -->
        <div class="stats">
          <div>Partidas Ganadas: <strong>0</strong></div>
          <div>Mejor Puntuación: <strong>0</strong></div>
        </div>

        <hr class="divider" />

        <h3 class="heading">Configuración Juego</h3>

        <!-- Volumen -->
        <div class="volume">
          <label>Volumen</label>
          <input type="range" v-model="volume" @input="changeVolume" min="0" max="100" />
          <span>{{ volume }}%</span>
        </div>

        <!-- Modo oscuro -->
        <label class="dark-mode">
          <input type="checkbox" v-model="isDarkMode" @change="toggleDarkMode" />
          Modo oscuro
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isOpen = ref(false);
const isDarkMode = ref(false);
const volume = ref(50);
const fileInput = ref(null);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');
const username = ref('Jugador');

// Imagen por defecto
const defaultImage = "data:image/png;base64,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";

const profileImage = ref(defaultImage);

// Obtener userId del localStorage o de donde lo guardes
// IMPORTANTE: Cambia esto por tu forma de obtener el userId
const userId = ref(localStorage.getItem('userId') || '1'); // Temporalmente uso '1' para testing

onMounted(() => {
  loadUserProfile();
});

const loadUserProfile = () => {
  if (userId.value) {
    console.log('Cargando imagen de perfil para userId:', userId.value);
    // Cargar la imagen del usuario desde el servidor
    fetch(`/api/get-profile-image/${userId.value}`)
      .then(response => response.json())
      .then(data => {
        console.log('Respuesta del servidor:', data);
        if (data.ok && data.imagePath) {
          profileImage.value = data.imagePath;
          showMessage('Imagen cargada correctamente', 'success');
        }
      })
      .catch(error => {
        console.error('Error al cargar imagen de perfil:', error);
        showMessage('Error al cargar imagen', 'error');
      });
  }
};

const toggleDarkMode = () => {
  document.body.classList.toggle('dark-mode', isDarkMode.value);
};

const changeVolume = () => {
  console.log('Volumen:', volume.value);
};

const openFileSelector = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showMessage('La imagen no debe superar 5MB', 'error');
    return;
  }

  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showMessage('Solo se permiten imágenes (jpg, png, gif, webp)', 'error');
    return;
  }

  if (!userId.value) {
    showMessage('Debes iniciar sesión para cambiar tu foto', 'error');
    return;
  }

  await uploadImage(file);
};

const uploadImage = async (file) => {
  isUploading.value = true;
  uploadMessage.value = '';

  console.log('Iniciando subida de imagen...');

  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId.value);

    console.log('Enviando FormData al servidor...');

    const response = await fetch('http://localhost:3000/api/upload-profile-image', {  // or whatever port your backend is running on
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Respuesta del servidor:', data);

    if (data.ok) {
      profileImage.value = data.imagePath;
      showMessage('✅ Foto actualizada correctamente', 'success');
      console.log('Nueva ruta de imagen:', data.imagePath);
    } else {
      showMessage('❌ ' + (data.message || 'Error al subir la imagen'), 'error');
      console.error('Error en la respuesta:', data);
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    showMessage('❌ Error de conexión al subir la imagen', 'error');
  } finally {
    isUploading.value = false;
    // Limpiar el input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const showMessage = (message, type) => {
  uploadMessage.value = message;
  uploadMessageType.value = type;
  console.log(`[${type.toUpperCase()}] ${message}`);
  setTimeout(() => {
    uploadMessage.value = '';
  }, 4000);
};

const changeUsername = () => {
  const newUsername = prompt('Introduce tu nuevo nombre:');
  if (newUsername && newUsername.trim()) {
    username.value = newUsername.trim();
    showMessage('✅ Nombre actualizado correctamente', 'success');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');

.config-button {
  position: absolute;
  bottom: 6vh;
  right: 5vw;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 16px;
  width: 56px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Poppins', sans-serif;
  box-shadow: 0 2px 8px rgba(255, 140, 0, 0.08);
}
.config-button:hover {
  background: #ffe5b2;
  color: #ff8c00;
  transform: scale(1.07);
  box-shadow: 0 4px 20px #ffa50055;
}
.config-button i {
  font-size: 1.6rem;
  transition: color 0.3s;
}
.config-button:hover i {
  color: #ff8c00;
}

.overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(10, 10, 20, 0.36);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
}

.popup {
  background: rgba(0, 0, 0, 0.795);
  border-radius: 24px;
  padding: 2.3rem 2.2rem 2rem 2.2rem;
  width: 370px;
  font-family: 'Poppins', sans-serif;
  color: #333;
  text-align: center;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(255, 140, 0, 0.14), 0 4px 6px rgba(0,0,0,0.09);
  animation: popupIn 0.26s cubic-bezier(0.19,1,0.22,1);
}
@keyframes popupIn {
  0% { transform: scale(0.7) translateY(40px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.close-button {
  position: absolute;
  top: 1.1rem;
  right: 1.2rem;
  background: none;
  border: none;
  font-size: 2.1rem;
  color: #ff8c00;
  cursor: pointer;
  transition: color 0.18s;
  font-family: 'Poppins', sans-serif;
  z-index: 10;
}
.close-button:hover {
  color: #ffa500;
}

.heading {
  margin: 1.3rem 0 1.4rem 0;
  color: #ffaa00;
  font-size: 1.22rem;
  font-weight: 700;
  letter-spacing: .5px;
  text-transform: uppercase;
  text-shadow: 0 1px 8px #fff3;
  font-family: 'Poppins', sans-serif;
}
.nombre {
  margin: 0.1rem 0 1.3rem 0;
  color: #eddfdf;
  font-weight: 900;
  font-size: 1.37rem;
  letter-spacing: .2px;
  font-family: 'Poppins', sans-serif;
}

.user-photo {
  width: 84px;
  height: 84px;
  margin: 0 auto 1.2rem auto;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #ffd70088;
  background: #fff7e3;
  box-shadow: 0 2px 10px #ffd70022;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  position: relative;
  cursor: pointer;
}

.user-photo:hover {
  border-color: #ffd700;
  transform: scale(1.05);
}

.user-photo:hover .hover-text {
  opacity: 1;
}

.user-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  background: #ffd70019;
}

.hover-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
  font-size: 1.5rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ff8c00;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.25rem;
}
.btn {
  padding: 0.38rem 0.8rem;
  background: linear-gradient(90deg, #ff8c00, #ffd700ee);
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.19s;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px #fff9;
}

.btn:hover {
  background: linear-gradient(90deg, #ffd700, #ff8c00dd);
  color: #fff;
  box-shadow: 0 0 15px #ff8c0066;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-family: 'Poppins', sans-serif;
  animation: fadeIn 0.3s;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stats {
  background: #fff1e2ee;
  padding: 0.92rem 0.5rem;
  border-radius: 14px;
  margin-bottom: 1.2rem;
  font-size: 1rem;
  box-shadow: 0 2px 12px #ff8c0011;
  border: 1.5px solid #ffdfa533;
}
.stats div {
  padding: 0.25rem 0;
  color: #9f750b;
  font-family: 'Poppins', sans-serif;
}
.stats strong {
  color: #ff8c00;
  font-weight: 900;
}

.divider {
  border: none;
  border-top: 1.6px solid #ffd70066;
  margin: 1.5rem 0 1.3rem 0;
  width: 85%;
}

.volume {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  justify-content: center;
  margin: 1.25rem 0 0.25rem 0;
}
.volume label {
  font-weight: 600;
  color: #b68700;
  font-family: 'Poppins', sans-serif;
  letter-spacing: .2px;
}
.volume input[type="range"] {
  width: 130px;
  accent-color: #ff8c00;
  background: #ffdfa555;
  border-radius: 5px;
  height: 6px;
  outline: none;
}
.volume span {
  min-width: 38px;
  color: #ffaa00;
  font-weight: 700;
  font-size: 1.01rem;
  font-family: 'Poppins', sans-serif;
}

.dark-mode {
  display: flex;
  align-items: center;
  gap: 0.57rem;
  cursor: pointer;
  justify-content: center;
  margin: 1.1rem 0 .3rem 0;
  font-weight: 700;
  color: #f1e9e9;
  font-family: 'Poppins', sans-serif;
  user-select: none;
}
.dark-mode input[type="checkbox"] {
  width: 1.18rem;
  height: 1.18rem;
  accent-color: #ff8c00;
}
</style>

<style>
body.dark-mode {
  background: #181422 !important;
  color: #fff !important;
}
body.dark-mode .popup {
  background: rgba(24,20,34,0.99) !important;
  color: #fff !important;
}
body.dark-mode .heading {
  color: #ffd700 !important;
}
body.dark-mode .stats {
  background: #28212c !important;
  border-color: #ffd70033 !important;
}
body.dark-mode .user-photo {
  border-color: #ffa500;
  background: #222;
}
body.dark-mode .divider {
  border-top-color: #ffd70066;
}
body.dark-mode .btn {
  color: #fff !important;
  background: linear-gradient(90deg, #ff8c00, #ffd700bb) !important;
}
body.dark-mode .btn:hover {
  background: linear-gradient(90deg, #ffd700, #ff8c00) !important;
  color: #fffde7 !important;
}
</style>