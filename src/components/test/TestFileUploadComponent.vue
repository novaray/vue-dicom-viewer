<script setup lang="ts">
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { onMounted, reactive, ref } from 'vue';
import { convertMultiframeImageIds, prefetchMetadataInformation } from '@/helpers/dicom/convertMultiframeImageIds';
import * as cornerstoneTools from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';
import { metaData, RenderingEngine, type Types } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import { uids } from '@/models/dicom/uids';

const {
  PanTool,
  WindowLevelTool,
  StackScrollMouseWheelTool,
  ZoomTool,
  ToolGroupManager,
} = cornerstoneTools;
const toolGroupId = 'myToolGroup';

const divTag = ref<HTMLDivElement | null>(null);
const viewport = ref<Types.IViewport>();
const metadata = reactive<{
  info: string,
  value: any
}[]>([]);

const run = async () => {
  const content = divTag.value;
  const element = document.createElement('div');
  element.oncontextmenu = (e) => e.preventDefault();
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);

  cornerstoneTools.addTool(PanTool);
  cornerstoneTools.addTool(WindowLevelTool);
  cornerstoneTools.addTool(StackScrollMouseWheelTool);
  cornerstoneTools.addTool(ZoomTool);

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

  // Get Cornerstone imageIds and fetch metadata into RAM

  // Instantiate a rendering engine
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create a stack viewport
  const viewportId = 'CT_STACK';
  const viewportInput = {
    viewportId,
    type: ViewportType.STACK,
    element,
    defaultOptions: {
      background: <Types.Point3>[0.2, 0, 0.2],
    },
  };

  renderingEngine.enableElement(viewportInput);

  // Get the stack viewport that was created
  viewport.value = <Types.IStackViewport>renderingEngine.getViewport(viewportId);

  toolGroup.addViewport(viewportId, renderingEngineId);
}

const onChangeFile = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) {
    return;
  }

  const file = files[0];
  const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
  loadAndViewImage(imageId);
};

const loadAndViewImage = async (imageId: string) => {
  if (!viewport.value) {
    return;
  }

  await prefetchMetadataInformation([imageId]);
  const stack = convertMultiframeImageIds([imageId]);

  // @ts-ignore - Set the stack on the viewport
  viewport.value.setStack(stack).then(() => {
    // Set the VOI of the stack
    // viewport.setProperties({ voiRange: ctVoiRange });
    // Render the image
    viewport.value!.render();

    // @ts-ignore
    const imageData = viewport.value!.getImageData();

    const {
      pixelRepresentation,
      bitsAllocated,
      bitsStored,
      highBit,
      photometricInterpretation,
    } = metaData.get('imagePixelModule', imageId);

    const voiLutModule = metaData.get('voiLutModule', imageId);

    const sopCommonModule = metaData.get('sopCommonModule', imageId);
    const transferSyntax = metaData.get('transferSyntax', imageId);

    metadata.push({
      info: 'transferSyntax',
      value: transferSyntax.transferSyntaxUID,
    });
    metadata.push({
      info: 'sopClassUID',
      value: `${sopCommonModule.sopClassUID} [${uids[sopCommonModule.sopClassUID]}]`,
    });
    metadata.push({
      info: 'sopInstanceUID',
      value: sopCommonModule.sopInstanceUID,
    });
    metadata.push({
      info: 'rows',
      value: imageData.dimensions[0],
    });
    metadata.push({
      info: 'columns',
      value: imageData.dimensions[1],
    });
    metadata.push({
      info: 'spacing',
      value: imageData.spacing.join('\\'),
    });
    metadata.push({
      info: 'direction',
      value: imageData.direction
        .map((x: number) => Math.round(x * 100) / 100)
        .join(','),
    });
    metadata.push({
      info: 'origin',
      value: imageData.origin
        .map((x: number) => Math.round(x * 100) / 100)
        .join(','),
    });
    metadata.push({
      info: 'modality',
      value: imageData.metadata.Modality,
    });
    metadata.push({
      info: 'pixelRepresentation',
      value: pixelRepresentation,
    });
    metadata.push({
      info: 'bitsAllocated',
      value: bitsAllocated,
    });
    metadata.push({
      info: 'bitsStored',
      value: bitsStored,
    });
    metadata.push({
      info: 'highBit',
      value: highBit,
    });
    metadata.push({
      info: 'photometricInterpretation',
      value: photometricInterpretation,
    });
    metadata.push({
      info: 'windowCenter',
      value: voiLutModule.windowCenter,
    });
    metadata.push({
      info: 'windowWidth',
      value: voiLutModule.windowWidth,
    });
  });
}

onMounted(run);
</script>

<template>
  <div class="flex-row">
    <div>
      <input
        class="file-input"
        type="file"
        accept="application/dicom"
        @change="onChangeFile"
      />
      <div ref="divTag"/>
    </div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col :style="{width: '220px'}"/>
          <col :style="{width: '500px'}"/>
        </colgroup>
        <thead>
          <tr>
            <th>info</th>
            <th>value</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in metadata"
            :key="item.info"
          >
            <td>{{item.info}}</td>
            <td>{{item.value}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-input {
  margin-bottom: 1rem;
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin: 1rem;
  gap: 0.6rem;
}

.table-wrap {
  margin-top: 3rem;
}
</style>
