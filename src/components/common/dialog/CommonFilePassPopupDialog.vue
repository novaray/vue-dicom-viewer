<script setup lang="ts">
import { useCommonFilePassPopupDialogStore } from '@/stores/CommonFilePassPopupDialogStore';
import { ref } from 'vue';

const dialogStore = useCommonFilePassPopupDialogStore();
const file = ref<File>();

interface Emit {
  (event: 'submit', file: File): void;
  (event: 'close'): void;
}
const emit = defineEmits<Emit>();

const onChangeFile = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) {
    return;
  }

  file.value = files[0];
};

const onSubmit = () => {
  emit('submit', file.value!);
  file.value = undefined;
};

const onClose = () => {
  emit('close');
  file.value = undefined;
};
</script>

<template>
  <Transition name="modal">
    <div
      v-if="dialogStore.visible"
      class="modal-mask"
    >
      <div class="modal-container">
        <div class="modal-header">
          <slot name="header">zip 파입 업로드 및 popup</slot>
        </div>

        <div class="modal-body">
          <slot name="body">
            <input
              class="file-input"
              type="file"
              accept="application/zip"
              @change="onChangeFile"
            />
          </slot>
        </div>

        <div class="modal-footer">
          <slot name="footer">
            <button
              class="modal-default-button"
              :disabled="!file"
              @click="onSubmit"
            >
              SUBMIT
            </button>
            <button
              class="modal-default-button"
              @click="onClose"
            >
              CLOSE
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 300px;
  margin: auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
