<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import createImageIdsAndCacheMetaData from '@/helpers/dicom/createImageIdsAndCacheMetaData';
import { cache, Enums, RenderingEngine, setVolumesForViewports, type Types, volumeLoader } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import {
  addTool, PanTool, ReferenceLines, removeTool, StackScrollMouseWheelTool, ToolGroupManager, WindowLevelTool, ZoomTool
} from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';

// Define a unique id for the volume
const volumeName = 'CT_VOLUME_ID_SCROLL'; // id of the volume less loader prefix
const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id
const viewportIds = ['CT_AXIAL_SCROLL', 'CT_SAGITTAL_SCROLL', 'CT_OBLIQUE_SCROLL'];

const divTag = ref<HTMLDivElement | null>(null);

// Instantiate a rendering engine
const renderingEngineId = 'scrollRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));

// Define a tool group, which defines how mouse events map to tool commands for Any viewport using the group
const toolGroupId = 'STACK_TOOL_GROUP_ID_SCROLL';
const toolGroup = ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup;

const run = async () => {
  const content = divTag.value;
  const viewportGrid = document.createElement('div');
  viewportGrid.style.display = 'flex';
  viewportGrid.style.flexDirection = 'row';

  // element for axial view
  const element1 = document.createElement('div');
  element1.oncontextmenu = (e) => e.preventDefault();
  element1.style.width = '500px';
  element1.style.height = '500px';

  // element for sagittal view
  const element2 = document.createElement('div');
  element2.oncontextmenu = (e) => e.preventDefault();
  element2.style.width = '500px';
  element2.style.height = '500px';

  // element for oblique view
  const element3 = document.createElement('div');
  element3.oncontextmenu = (e) => e.preventDefault();
  element3.style.width = '500px';
  element3.style.height = '500px';

  viewportGrid.appendChild(element1);
  viewportGrid.appendChild(element2);
  viewportGrid.appendChild(element3);

  content!.appendChild(viewportGrid);

  // Add tools to Cornerstone3D
  addTool(WindowLevelTool);
  addTool(ReferenceLines);
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(StackScrollMouseWheelTool);

  // Add the tools to the tool group and specify which volume they are pointing at
  toolGroup.addTool(WindowLevelTool.toolName, {volumeId});
  toolGroup.addTool(ReferenceLines.toolName, {volumeId});
  toolGroup.addTool(PanTool.toolName, {volumeId});
  toolGroup.addTool(ZoomTool.toolName, {volumeId});
  toolGroup.addTool(StackScrollMouseWheelTool.toolName);

  // Set the initial state of the tools, here we set one tool active on left click.
  // This means left click will draw that tool.
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary // Left Click
      },
    ],
  });
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Auxiliary // wheel Click
      },
    ],
  });

  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Secondary // Right Click
      },
    ],
  });
  toolGroup.setToolEnabled(ReferenceLines.toolName);
  toolGroup.setToolConfiguration(ReferenceLines.toolName, {
    sourceViewportId: 'CT_AXIAL_SCROLL'
  });

  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
  });

  // Create the viewports
  const viewportInputArray = [
    {
      viewportId: viewportIds[0],
      type: ViewportType.ORTHOGRAPHIC,
      element: element1,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
        background: <Types.Point3> [0.2, 0, 0.2]
      }
    },
    {
      viewportId: viewportIds[1],
      type: ViewportType.ORTHOGRAPHIC,
      element: element2,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
        background: <Types.Point3> [0.2, 0, 0.2]
      }
    },
    {
      viewportId: viewportIds[2],
      type: ViewportType.ORTHOGRAPHIC,
      element: element3,
      defaultOptions: {
        orientation: Enums.OrientationAxis.CORONAL,
        background: <Types.Point3> [0.2, 0, 0.2]
      }
    }
  ];

  renderingEngine.setViewports(viewportInputArray);

  // Set the tool group on the viewports
  viewportIds.forEach((viewportId) =>
    toolGroup.addViewport(viewportId, renderingEngineId)
  );

  // Define a volume in memory
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  // Set the volume to load
  volume.load();

  await setVolumesForViewports(
    renderingEngine,
    [{volumeId}],
    viewportIds
  );

  // Render the image
  renderingEngine.renderViewports(viewportIds);
};

onMounted(run);

onUnmounted(() => {
  cache.purgeCache();
  ToolGroupManager.destroyToolGroup(toolGroupId);
  removeTool(WindowLevelTool);
  removeTool(ReferenceLines);
  removeTool(PanTool);
  removeTool(ZoomTool);
  removeTool(StackScrollMouseWheelTool);
  renderingEngine.destroy();
});
</script>

<template>
  <div ref="divTag"></div>
</template>

<style scoped lang="scss">

</style>
