<script setup lang="ts">
import TestStackOfImageComponent from '@/components/test/TestStackOfImageComponent.vue';
import TestVolumeComponent from '@/components/test/TestVolumeComponent.vue';
import { ref } from 'vue';
import TestVideoComponent from '@/components/test/TestVideoComponent.vue';
import TestManipulationToolsComponent from '@/components/test/TestManipulationToolsComponent.vue';
import TestAnnotationToolsComponent from '@/components/test/TestAnnotationToolsComponent.vue';
import TestSegmentationToolsComponent from '@/components/test/TestSegmentationToolsComponent.vue';

const tabs = {
  TestStackOfImageComponent,
  TestVolumeComponent,
  TestVideoComponent,
  TestManipulationToolsComponent,
  TestAnnotationToolsComponent,
  TestSegmentationToolsComponent
};

const currentComponent = ref(TestStackOfImageComponent);

const onClickTab = (tab: any) => {
  currentComponent.value = tab;
};
</script>

<template>
  <div class="flex-row">
    <button
      v-for="(tab, index) in tabs"
      :key="index"
      @click="onClickTab(tab)"
    >
      {{ tab.__name }}
    </button>
  </div>

  <keep-alive>
    <Suspense>
      <component :is="currentComponent"/>
    </Suspense>
  </keep-alive>
</template>

<style scoped lang="scss">
.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 1rem;
  gap: 1rem;
}
</style>
