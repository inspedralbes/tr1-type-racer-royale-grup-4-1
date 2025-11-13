<template>
  <Transition name="fade">
    <div v-if="show" class="toast">
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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
