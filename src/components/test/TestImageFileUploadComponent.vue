<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { addTool, PanTool, removeTool, StackScrollMouseWheelTool, ToolGroupManager, WindowLevelTool, ZoomTool } from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';
import { cache, imageLoader, metaData, RenderingEngine, type Types } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import { hardcodedMetaDataProvider } from '@/helpers/dicom/hardcodedMetaDataProvider';
import { registerWebImageLoader } from '@/helpers/dicom/registerWebImageLoader';
import { onBeforeRouteLeave } from 'vue-router';

const toolGroupId = 'ToolGroup_ImageFileBasic';
const viewportId = 'IMAGE_FILE_CT_STACK';

const divTag = ref<HTMLDivElement | null>(null);
const viewport = ref<Types.IViewport>();
const showDescribe = ref(false);

const blobUrls = reactive<string[]>([]);

// Instantiate a rendering engine
const renderingEngineId = 'RenderingEngine_ImageFileBasic';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));
registerWebImageLoader(imageLoader);

const run = async () => {
  const content = divTag.value;
  const element = document.createElement('div');
  element.oncontextmenu = (e) => e.preventDefault();
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);

  addTool(PanTool);
  addTool(WindowLevelTool);
  addTool(StackScrollMouseWheelTool);
  addTool(ZoomTool);

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup;

  // Add tools to the tool group
  toolGroup.addTool(WindowLevelTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(StackScrollMouseWheelTool.toolName);

  // Set the initial state of the tools, here all tools are active and bound to
  // Different mouse inputs
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Auxiliary, // Middle Click
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
  // As the Stack Scroll mouse wheel is a tool using the `mouseWheelCallback`
  // hook instead of mouse buttons, it does not need to assign any mouse button.
  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

  // Create a stack viewport
  const viewportInput = {
    viewportId,
    type: ViewportType.STACK,
    element,
    defaultOptions: {
      background: <Types.Point3> [0.2, 0, 0.2],
    }
  };

  renderingEngine.enableElement(viewportInput);

  // Get the stack viewport that was created
  viewport.value = <Types.IStackViewport> renderingEngine.getViewport(viewportId);

  toolGroup.addViewport(viewportId, renderingEngineId);
};

const onChangeFile = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) {
    return;
  }

  blobUrls.forEach(URL.revokeObjectURL);
  blobUrls.length = 0;

  showDescribe.value = files.length > 1;

  for (const file of files) {
    const blob = new Blob([file]);
    const imageUrl = URL.createObjectURL(blob);
    blobUrls.push(imageUrl);
  }

  loadAndViewImage(blobUrls);
};

const loadAndViewImage = (blobUrls: string[]) => {
  if (!viewport.value) {
    return;
  }

  metaData.addProvider(
    // @ts-ignore
    (type, imageId) => hardcodedMetaDataProvider(type, imageId, blobUrls),
    10000
  );

  // @ts-ignore - Set the stack on the viewport
  viewport.value.setStack(blobUrls).then(() => {
    renderingEngine.render();
  });
};

onMounted(run);

onBeforeRouteLeave(() => {
  blobUrls.forEach(URL.revokeObjectURL);
  cache.purgeCache();
  ToolGroupManager.destroyToolGroup(toolGroupId);
  removeTool(PanTool);
  removeTool(WindowLevelTool);
  removeTool(StackScrollMouseWheelTool);
  removeTool(ZoomTool);
  renderingEngine.destroy();
});
</script>

<template>
  <div class="wrapper">
    <input
      class="file-input"
      type="file"
      multiple
      accept=".png, .jpg, .jpeg"
      @change="onChangeFile"
    />
    <div ref="divTag"/>
    <p
      v-if="showDescribe"
      class="describe"
    >
      이미지 영역에서 마우스 스크롤 동작시 이미지가 넘어갑니다. <br/>
      처음 이미지 로드시에 동작이 부자연스러울 수 있습니다.
    </p>
  </div>
</template>

<style scoped lang="scss">
.file-input {
  margin-bottom: 1rem;
}

.describe {
  margin-top: 1rem;
}
</style>
