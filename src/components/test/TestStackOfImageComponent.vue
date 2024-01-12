<script setup lang="ts">
import { cache, RenderingEngine } from '@cornerstonejs/core';
import type { PublicViewportInput } from '@cornerstonejs/core/src/types/IViewport';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import createImageIdsAndCacheMetaData from '@/helpers/dicom/createImageIdsAndCacheMetaData';
import { onMounted, reactive, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

const divTag = ref<HTMLDivElement | null>(null);

const renderingEngineId = 'myRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));

onMounted(async () => {
  const imageIds: any[] = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb'
  });

  const content = divTag.value;
  const element = document.createElement('div');
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);

  const viewportId = 'CI_AXIAL_STACK';
  const viewportInput: PublicViewportInput = {
    element,
    viewportId: viewportId,
    type: ViewportType.STACK
  };
  renderingEngine.enableElement(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);

  // @ts-ignore
  viewport.setStack(imageIds, 60);

  viewport.render();
});

onBeforeRouteLeave(() => {
  cache.purgeCache();
  renderingEngine.destroy();
});
</script>

<template>
  <div ref="divTag"/>
</template>

<style scoped lang="scss">

</style>
