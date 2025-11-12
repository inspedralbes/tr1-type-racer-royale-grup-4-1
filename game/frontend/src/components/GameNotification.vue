<template>
  <Transition name="fade">
    <div v-if="show" class="notification-item">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const props = defineProps({
  message: String,
  duration: { type: Number, default: 3500 }
});
const show = ref(true);
onMounted(() => {
  setTimeout(() => { show.value = false; }, props.duration);
});
</script>

<style scoped>
.notification-item {
  background: #222;
  color: #fff;
  border: 2px solid #fff;
  padding: 10px 18px;
  border-radius: 8px;
  box-shadow: 2px 2px 0 #333;
  font-size: 1rem;
  opacity: 0.95;
  pointer-events: none;
  margin-bottom: 10px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
