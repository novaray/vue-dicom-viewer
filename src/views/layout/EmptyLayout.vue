<script setup lang="ts">
import { ref } from 'vue';
import { initDicom } from '@/helpers/dicom';

const init = ref(false);
initDicom().then(() => init.value = true);
</script>

<template>
  <RouterView v-if="init" />
</template>
