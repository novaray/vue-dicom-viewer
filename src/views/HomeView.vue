<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { initDicom } from '@/helpers/dicom';
import CommonFilePassPopupDialog from '@/components/common/dialog/CommonFilePassPopupDialog.vue';
import { useCommonFilePassPopupDialogStore } from '@/stores/CommonFilePassPopupDialogStore';

const router = useRouter();
const dialogStore = useCommonFilePassPopupDialogStore();

const init = ref(false);
initDicom().then(() => init.value = true);

const tabs = {
  'basicStackImage': 'Basic Stack Image',
  'localFile': 'Local File',
  'localFileWithTools': 'Local File With Tools',
  'unzipFile': 'Unzip File',
  'manipulationTools': 'Manipulation Tools',
  'video': 'video',
  'videoTools': 'videoTools',
  'memoryFileWindow': 'Memory File Window'
};

const onClickTab = (name: any) => {
  if (name === 'memoryFileWindow') {
    dialogStore.open();
    return;
  }

  router.push({
    name
  });
};

const onSubmit = (file: File) => {
  dialogStore.close();

  // 해당 서버를 하나 더 띄워서 테스트 해야함.
  const popup = window.open('http://localhost:5174/empty/memory-file-view', 'new Window', 'width=500,height=500');

  window.addEventListener('message', function(event) {
    if (event.origin !== 'http://localhost:5174') return; // 보안 검사
    console.log('부모 창에서 받은 메시지:', event.data);
  });

  setTimeout(function() {
    console.log(popup);
    popup!.postMessage(file, 'http://localhost:5174');
  }, 1500);
};

const onClose = () => {
  dialogStore.close();
};
</script>

<template>
  <div>
    <div class="tab-wrap">
      <button
        class="btn-grad"
        v-for="(tab, key) in tabs"
        :key="key"
        @click="onClickTab(key)"
      >
        {{ tab }}
      </button>
    </div>

    <RouterView v-if="init"/>
    <CommonFilePassPopupDialog
      @submit="onSubmit"
      @close="onClose"
    />
  </div>
</template>

<style scoped lang="scss">
.tab-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 1rem;
  gap: 0.5rem;
  width: 60vw;
  overflow: auto;
}

.btn-grad {
  background-image: linear-gradient(to right, #283048 0%, #859398 51%, #283048 100%);
  margin: 10px;
  padding: 15px 45px;
  text-align: center;
  transition: 0.5s;
  background-size: 200% auto;
  color: white;
  box-shadow: 0 0 20px #eee;
  border-radius: 10px;
  display: block;
}

.btn-grad:hover {
  background-position: right center;
  color: #fff;
  text-decoration: none;
}
</style>
