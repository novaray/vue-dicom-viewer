<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import createImageIdsAndCacheMetaData from '@/helpers/dicom/createImageIdsAndCacheMetaData';
import { cache, RenderingEngine } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import { addTool, ToolGroupManager, WindowLevelTool, ZoomTool, removeTool } from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';
import { onBeforeRouteLeave } from 'vue-router';

const divTag = ref<HTMLDivElement | null>(null);
const toolGroupId = 'manipulationToolGroup';
const toolGroup = reactive(ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup);
const renderingEngineId = 'manipulationRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));

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
  const element = document.createElement('div');

  // Disable the default context menu
  element.oncontextmenu = (e) => e.preventDefault();
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);

  const viewportId = 'CT_AXIAL_STACK';

  const viewportInput = {
    viewportId,
    element,
    type: ViewportType.STACK
  };

  renderingEngine.enableElement(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);

  // @ts-ignore
  viewport.setStack(imageIds);

  viewport.render();

  addTool(ZoomTool);
  addTool(WindowLevelTool);

  // Add tools to the ToolGroup
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(WindowLevelTool.toolName);

  toolGroup.addViewport(viewportId, renderingEngineId);

  // Set the windowLevel tool to be active when the mouse left button is pressed
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });

  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Secondary, // Right Click
      },
    ],
  });
});

onBeforeRouteLeave(() => {
  cache.purgeCache();
  ToolGroupManager.destroyToolGroup(toolGroupId);
  removeTool(ZoomTool);
  removeTool(WindowLevelTool);
  renderingEngine.destroy();
});
</script>

<template>
  <div ref="divTag"/>
</template>

<style scoped lang="scss">

</style>
