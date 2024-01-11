<script setup lang="ts">
import TestStackOfImageComponent from '@/components/test/TestStackOfImageComponent.vue';
import TestVolumeComponent from '@/components/test/TestVolumeComponent.vue';
import { ref } from 'vue';
import TestVideoComponent from '@/components/test/TestVideoComponent.vue';
import TestManipulationToolsComponent from '@/components/test/TestManipulationToolsComponent.vue';
import TestAnnotationToolsComponent from '@/components/test/TestAnnotationToolsComponent.vue';
import TestSegmentationToolsComponent from '@/components/test/TestSegmentationToolsComponent.vue';
import TestFileUploadComponent from '@/components/test/TestFileUploadComponent.vue';
import TestFileUploadManyToolComponent from '@/components/test/TestFileUploadManyToolComponent.vue';
import TestUnzipFileComponent from '@/components/test/TestUnzipFileComponent.vue';
import TestScrollVolumeComponent from '@/components/test/TestScrollVolumeComponent.vue';

const tabs = {
  'Stack_Of_Image': TestStackOfImageComponent,
  'Volume': TestVolumeComponent,
  'Video': TestVideoComponent,
  'Manipulation_Tools': TestManipulationToolsComponent,
  'Annotation_Tools': TestAnnotationToolsComponent,
  'Segmentation_Tools': TestSegmentationToolsComponent,
  'File_Upload': TestFileUploadComponent,
  'File_Upload_Many_Tool': TestFileUploadManyToolComponent,
  'Unzip_File': TestUnzipFileComponent,
  'Scroll_Volume': TestScrollVolumeComponent
};

const currentComponent = ref(TestScrollVolumeComponent);

const onClickTab = (tab: any) => {
  currentComponent.value = tab;
};
</script>

<template>
  <div>
    <div class="tab-wrap">
      <button
        class="btn-grad"
        v-for="(tab, key) in tabs"
        :key="key"
        @click="onClickTab(tab)"
      >
        {{ key }}
      </button>
    </div>

    <Suspense>
      <component :is="currentComponent"/>
    </Suspense>
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
  text-transform: uppercase;
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
