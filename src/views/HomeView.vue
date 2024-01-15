<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import initDicom from '@/helpers/dicom/initDicom';

const router = useRouter();

const init = ref(false);
initDicom().then(() => init.value = true);

const tabs = {
  'basicStackImage': 'Basic Stack Image',
  'localFile': 'Local File',
  'localFileWithTools': 'Local File With Tools',
  'unzipFile': 'Unzip File',
  'manipulationTools': 'Manipulation Tools'
};

const onClickTab = (name: any) => {
  router.push({
    name
  });
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
  background-image: linear-gradient(to right, #283048 0%, #859398  51%, #283048  100%);
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
