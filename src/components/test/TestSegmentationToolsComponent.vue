<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { createImageIdsAndCacheMetaData } from '@/helpers/dicom';
import { addTool, BrushTool, segmentation, SegmentationDisplayTool, ToolGroupManager } from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings, SegmentationRepresentations } from '@cornerstonejs/tools/dist/cjs/enums';
import { Enums, RenderingEngine, setVolumesForViewports, volumeLoader } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';

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

  const content = divTag.value;

  const viewportGrid = document.createElement('div');
  viewportGrid.style.display = 'flex';
  viewportGrid.style.flexDirection = 'row';

  // element for axial view
  const element1 = document.createElement('div');
  element1.style.width = '500px';
  element1.style.height = '500px';

  // element for sagittal view
  const element2 = document.createElement('div');
  element2.style.width = '500px';
  element2.style.height = '500px';

  // element for coronal view
  const element3 = document.createElement('div');
  element3.style.width = '500px';
  element3.style.height = '500px';

  viewportGrid.appendChild(element1);
  viewportGrid.appendChild(element2);
  viewportGrid.appendChild(element3);

  content!.appendChild(viewportGrid);

  addTool(SegmentationDisplayTool);
  addTool(BrushTool);

  const volumeName = 'CT_VOLUME_ID_SEGMENTATION';
  const toolGroupId = 'CT_TOOLGROUP_SEGMENTATION';
  const volumeLoaderScheme = 'cornerstoneStreamingImageVolume';
  const volumeId = `${volumeLoaderScheme}:${volumeName}`;
  const segmentationId = 'MY_SEGMENTATION_ID';
  // Define tool groups to add the segmentation display tool to
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup;

  // Segmentation Tools
  toolGroup.addTool(SegmentationDisplayTool.toolName);
  toolGroup.addTool(BrushTool.toolName);
  toolGroup.setToolEnabled(SegmentationDisplayTool.toolName);

  toolGroup.setToolActive(BrushTool.toolName, {
    bindings: [{mouseButton: MouseBindings.Primary}],
  });

  // Define a volume in memory for CT
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  // Create a segmentation of the same resolution as the source data for the CT volume
  await volumeLoader.createAndCacheDerivedSegmentationVolume(volumeId, {
    volumeId: segmentationId,
  });

  // Add the segmentations to state
  segmentation.addSegmentations([
    {
      segmentationId,
      representation: {
        // The type of segmentation
        type: SegmentationRepresentations.Labelmap,
        // The actual segmentation data, in the case of labelmap this is a
        // reference to the source volume of the segmentation.
        data: {
          volumeId: segmentationId,
        },
      },
    },
  ]);

  // Instantiate a rendering engine
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create the viewports
  const viewportId1 = 'CT_AXIAL';
  const viewportId2 = 'CT_SAGITTAL';
  const viewportId3 = 'CT_CORONAL';

  const viewportInputArray = [
    {
      viewportId: viewportId1,
      type: ViewportType.ORTHOGRAPHIC,
      element: element1,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
      }
    },
    {
      viewportId: viewportId2,
      type: ViewportType.ORTHOGRAPHIC,
      element: element2,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
      }
    },
    {
      viewportId: viewportId3,
      type: ViewportType.ORTHOGRAPHIC,
      element: element3,
      defaultOptions: {
        orientation: Enums.OrientationAxis.CORONAL,
      }
    }
  ];

  renderingEngine.setViewports(viewportInputArray);

  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
  toolGroup.addViewport(viewportId3, renderingEngineId);

  // Set the volume to load
  volume.load();

  // Set volumes on the viewports
  await setVolumesForViewports(
    renderingEngine,
    [
      {
        volumeId,
      },
    ],
    [viewportId1, viewportId2, viewportId3]
  );

  // Add the segmentation representation to the toolGroup
  await segmentation.addSegmentationRepresentations(toolGroupId, [
    {
      segmentationId,
      type: SegmentationRepresentations.Labelmap,
    },
  ]);

  // Render the image
  renderingEngine.renderViewports([viewportId1, viewportId2, viewportId3]);
});
</script>

<template>
  <div ref="divTag"/>
</template>

<style scoped lang="scss">

</style>
