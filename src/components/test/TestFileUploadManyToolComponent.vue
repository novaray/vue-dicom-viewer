<script setup lang="ts">
import { wadouri } from '@cornerstonejs/dicom-image-loader';
import { onMounted, reactive, ref } from 'vue';
import { convertMultiframeImageIds, prefetchMetadataInformation } from '@/helpers/dicom/convertMultiframeImageIds';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';
import { cache, metaData, RenderingEngine, type Types } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import { uids } from '@/models/dicom/uids';
import { onBeforeRouteLeave } from 'vue-router';
import {
  addTool,
  AngleTool, ArrowAnnotateTool, BidirectionalTool, CircleROITool, EllipticalROITool, LengthTool, ProbeTool, RectangleROITool, removeTool,
  ToolGroupManager
} from '@cornerstonejs/tools';

const toolsNames = [
  LengthTool.toolName,
  ProbeTool.toolName,
  RectangleROITool.toolName,
  EllipticalROITool.toolName,
  CircleROITool.toolName,
  BidirectionalTool.toolName,
  AngleTool.toolName,
  ArrowAnnotateTool.toolName,
];
const toolGroupId = 'fileUploadWIthToolGroup';

const divTag = ref<HTMLDivElement | null>(null);

// Instantiate a rendering engine
const renderingEngineId = 'myRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));
const viewport = ref<Types.IViewport>();

const selectedToolName = ref<string>(toolsNames[0]);
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

  // Add tools to Cornerstone3D
  addTool(LengthTool);
  addTool(ProbeTool);
  addTool(RectangleROITool);
  addTool(EllipticalROITool);
  addTool(CircleROITool);
  addTool(BidirectionalTool);
  addTool(AngleTool);
  addTool(ArrowAnnotateTool);

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup;

  // Add tools to the tool group
  toolGroup.addTool(LengthTool.toolName);
  toolGroup.addTool(ProbeTool.toolName);
  toolGroup.addTool(RectangleROITool.toolName);
  toolGroup.addTool(EllipticalROITool.toolName);
  toolGroup.addTool(CircleROITool.toolName);
  toolGroup.addTool(BidirectionalTool.toolName);
  toolGroup.addTool(AngleTool.toolName);
  toolGroup.addTool(ArrowAnnotateTool.toolName);

  // Set the initial state of the tools, here all tools are active and bound to
  // Different mouse inputs
  toolGroup.setToolActive(LengthTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });

  // We set all the other tools passive here, this means that any state is rendered, and editable
  // But aren't actively being drawn (see the toolModes example for information)
  toolGroup.setToolPassive(ProbeTool.toolName);
  toolGroup.setToolPassive(RectangleROITool.toolName);
  toolGroup.setToolPassive(EllipticalROITool.toolName);
  toolGroup.setToolPassive(CircleROITool.toolName);
  toolGroup.setToolPassive(BidirectionalTool.toolName);
  toolGroup.setToolPassive(AngleTool.toolName);
  toolGroup.setToolPassive(ArrowAnnotateTool.toolName);

  // Create a stack viewport
  const viewportId = 'CT_STACK_20230110';
  const viewportInput = {
    viewportId,
    type: ViewportType.STACK,
    element,
    defaultOptions: {
      background: <Types.Point3> [0.2, 0, 0.2],
    },
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

  metadata.length = 0;
  const file = files[0];
  const imageId = wadouri.fileManager.add(file);
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
};

const onSelectChange = (event: Event) => {
  const newToolName = (event.target as HTMLSelectElement).value;
  const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

  if (!toolGroup) {
    return;
  }

  toolGroup.setToolActive(newToolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      }
    ]
  });

  toolGroup.setToolPassive(selectedToolName.value);
  selectedToolName.value = newToolName;
};

onMounted(run);

onBeforeRouteLeave(() => {
  cache.purgeCache();
  ToolGroupManager.destroyToolGroup(toolGroupId);
  removeTool(LengthTool);
  removeTool(ProbeTool);
  removeTool(RectangleROITool);
  removeTool(EllipticalROITool);
  removeTool(CircleROITool);
  removeTool(BidirectionalTool);
  removeTool(AngleTool);
  removeTool(ArrowAnnotateTool);
  renderingEngine.destroy();
});
</script>

<template>
  <div class="flex-row">
    <div>
      <select
        name="tools"
        @change="onSelectChange"
      >
        <option
          v-for="toolName in toolsNames"
          :key="toolName"
        >
          {{ toolName }}
        </option>
      </select>
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
            <td>{{ item.info }}</td>
            <td>{{ item.value }}</td>
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

select {
  margin-bottom: 8px;
}
</style>
