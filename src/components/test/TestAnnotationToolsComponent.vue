<script setup lang="ts">
import { onMounted, ref } from 'vue';
import createImageIdsAndCacheMetaData from '@/helpers/dicom/createImageIdsAndCacheMetaData';
import { Enums, RenderingEngine, setVolumesForViewports, volumeLoader } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import { addTool, BidirectionalTool, ToolGroupManager } from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';

const divTag = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
  });

  const content = divTag.value as HTMLDivElement;

  // element for axial view
  const element1 = document.createElement('div');
  element1.style.width = '500px';
  element1.style.height = '500px';

  // element for sagittal view
  const element2 = document.createElement('div');
  element2.style.width = '500px';
  element2.style.height = '500px';

  content.appendChild(element1);
  content.appendChild(element2);

  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // note we need to add the cornerstoneStreamingImageVolume: to
  // use the streaming volume loader
  const volumeId = 'cornerstoneStreamingImageVolume: myVolume';

  // Define a volume in memory
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  const viewportId1 = 'CT_AXIAL_ANNOTATION';
  const viewportId2 = 'CT_SAGITTAL_ANNOTATION';

  const viewportInput = [
    {
      viewportId: viewportId1,
      element: element1,
      type: ViewportType.ORTHOGRAPHIC,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
      },
    },
    {
      viewportId: viewportId2,
      element: element2,
      type: ViewportType.ORTHOGRAPHIC,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
      },
    },
  ];

  renderingEngine.setViewports(viewportInput);

  addTool(BidirectionalTool);

  const toolGroupId = 'myToolGroup';
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup;
  toolGroup.addTool(BidirectionalTool.toolName);

  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
  toolGroup.setToolActive(BidirectionalTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });

  // Set the volume to load
  volume.load();

  setVolumesForViewports(
    renderingEngine,
    [
      {
        volumeId,
        callback: ({ volumeActor }) => {
          // set the windowLevel after the volumeActor is created
          volumeActor
            .getProperty()
            .getRGBTransferFunction(0)
            .setMappingRange(-180, 220);
        },
      },
    ],
    [viewportId1, viewportId2]
  );

  // Render the image
  renderingEngine.renderViewports([viewportId1, viewportId2]);
});
</script>

<template>
  <div ref="divTag"/>
</template>

<style scoped lang="scss">

</style>
