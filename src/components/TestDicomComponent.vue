<script setup lang="ts">
import initDicom from '@/helpers/dicom/initDicom';
import { RenderingEngine } from '@cornerstonejs/core';
import type { PublicViewportInput } from '@cornerstonejs/core/src/types/IViewport';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import createImageIdsAndCacheMetaData from '@/helpers/dicom/createImageIdsAndCacheMetaData';
import { onMounted } from 'vue';

await initDicom();

onMounted(async () => {
  const getImageIds = async () => {
    const imageIds = await createImageIdsAndCacheMetaData({
      StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
      SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
      wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb'
    });

    return imageIds;
  };
  const imageIds: any[] = await getImageIds();

  const content = document.getElementById('content');
  const element = document.createElement('div');
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);

  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

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
</script>

<template>
  <div id="content">

  </div>
</template>

<style scoped lang="scss">

</style>
