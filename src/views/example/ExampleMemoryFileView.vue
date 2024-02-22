<script setup lang="ts">
import TestUnzipFileComponent from '@/components/test/TestUnzipFileComponent.vue';
import { ref } from 'vue';

const file = ref<File>();

window.addEventListener('message',  (event) => {
  // event.origin을 통해 출처를 안전하게 검사할 수 있다.
  if (event.origin !== 'http://localhost:5173') {
    return;
  }

  console.log(event.data);
  event.source?.postMessage('World!', event.origin); // 메시지를 받으면 메시지를 보낸 쪽에 'World!' 데이터를 보낸다.
  file.value = event.data;
}, false);

</script>

<template>
  <TestUnzipFileComponent :file="file" />
</template>

<style scoped lang="scss">

</style>
