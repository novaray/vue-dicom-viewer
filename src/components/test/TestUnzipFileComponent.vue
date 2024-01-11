<script setup lang="ts">
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { convertMultiframeImageIds, prefetchMetadataInformation } from '@/helpers/dicom/convertMultiframeImageIds';
import * as cornerstoneTools from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';
import { cache, metaData, RenderingEngine, type Types } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import { uids } from '@/models/dicom/uids';
import JSZip from 'jszip';
import CommonLoadingSpinner from '@/components/common/CommonLoadingSpinner.vue';

interface UnzipFile {
  name: string;
  imageId: string | undefined;
}

const zip = new JSZip();

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

// Instantiate a rendering engine
const renderingEngineId = 'myRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));

const metadata = ref<{
  info: string,
  value: any
}[]>([]);
const uploadedFiles = ref<UnzipFile[]>([]);
const unzipLoading = ref(false);
const fileMatchingLoading = ref(false);

const isLoading = computed(() => unzipLoading.value || fileMatchingLoading.value);
const getLoadingText = computed(() => unzipLoading.value ? '파일 압축 해제 중' : '파일 매칭 중');
const getListClass = computed(() => isLoading.value ? 'cursor-wait' : 'cursor-pointer');

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

  // Create a stack viewport
  const viewportId = 'CT_STACK';
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

  uploadedFiles.value = [];
  metadata.value = [];
  const file = files[0];
  unzipLoading.value = true;
  fileMatchingLoading.value = true;
  zip.loadAsync(file)
     .then((zip) => {
       unzipLoading.value = false;
       const files = zip.filter((relativePath, zipEntry) => {
                          if (zipEntry.dir) {
                            return false;
                          }

                          return zipEntry.name.endsWith('.dcm');
                        })
                        .sort((zipEntry1, zipEntry2) => fileNameSortPredicate(zipEntry1.name, zipEntry2.name));

       const promises = files.map((zipEntry) => {
         return zipEntry.async('blob')
                        .then((blob: Blob) => {
                          const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(blob);
                          return {
                            name: zipEntry.name,
                            imageId
                          };
                        });
       });

       uploadedFiles.value = files.map((zieEntry) => ({
         name: zieEntry.name,
         imageId: undefined
       }));

       return Promise.all(promises);
     })
     .then((unzipFiles: UnzipFile[]) => uploadedFiles.value = unzipFiles)
     .catch((err) => console.error(err))
     .finally(() => {
       unzipLoading.value = false;
       fileMatchingLoading.value = false;
     });
};

const fileNameSortPredicate = (fileName1: string, fileName2: string) => {
  const nameA = fileName1.toUpperCase();
  const nameB = fileName2.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
}

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

    metadata.value.push({
      info: 'transferSyntax',
      value: transferSyntax.transferSyntaxUID,
    });
    metadata.value.push({
      info: 'sopClassUID',
      value: `${sopCommonModule.sopClassUID} [${uids[sopCommonModule.sopClassUID]}]`,
    });
    metadata.value.push({
      info: 'sopInstanceUID',
      value: sopCommonModule.sopInstanceUID,
    });
    metadata.value.push({
      info: 'rows',
      value: imageData.dimensions[0],
    });
    metadata.value.push({
      info: 'columns',
      value: imageData.dimensions[1],
    });
    metadata.value.push({
      info: 'spacing',
      value: imageData.spacing.join('\\'),
    });
    metadata.value.push({
      info: 'direction',
      value: imageData.direction
                      .map((x: number) => Math.round(x * 100) / 100)
                      .join(','),
    });
    metadata.value.push({
      info: 'origin',
      value: imageData.origin
                      .map((x: number) => Math.round(x * 100) / 100)
                      .join(','),
    });
    metadata.value.push({
      info: 'modality',
      value: imageData.metadata.Modality,
    });
    metadata.value.push({
      info: 'pixelRepresentation',
      value: pixelRepresentation,
    });
    metadata.value.push({
      info: 'bitsAllocated',
      value: bitsAllocated,
    });
    metadata.value.push({
      info: 'bitsStored',
      value: bitsStored,
    });
    metadata.value.push({
      info: 'highBit',
      value: highBit,
    });
    metadata.value.push({
      info: 'photometricInterpretation',
      value: photometricInterpretation,
    });
    metadata.value.push({
      info: 'windowCenter',
      value: voiLutModule.windowCenter,
    });
    metadata.value.push({
      info: 'windowWidth',
      value: voiLutModule.windowWidth,
    });
  });
};

const onClickFile = (file: UnzipFile) => {
  if (!file.imageId) {
    return;
  }

  metadata.value.length = 0;
  loadAndViewImage(file.imageId);
};

onMounted(run);

onUnmounted(() => {
  cache.purgeCache();
  ToolGroupManager.destroyToolGroup(toolGroupId);
  cornerstoneTools.destroy();
  renderingEngine.destroy();
})
</script>

<template>
  <div class="flex-row-wrap">
    <div>
      <input
        class="file-input"
        type="file"
        accept="application/zip"
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
    <div class="file-list-wrap">
      <CommonLoadingSpinner
        v-show="isLoading"
        :text="getLoadingText"
      />
      <ul v-show="!unzipLoading">
        <li
          :class="getListClass"
          v-for="file in uploadedFiles"
          :key="file.name"
          @click="onClickFile(file)"
        >
          {{file.name}}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-input {
  margin-bottom: 1rem;
}

.flex-row-wrap {
  display: flex;
  flex-direction: row;
  margin: 1rem;
  gap: 0.6rem;
  min-height: 800px;
}

.table-wrap {
  margin-top: 3rem;
}

.file-list-wrap {
  margin-left: 1rem;
  height: 550px;
  width: 330px;
  overflow: auto;
  border: black solid 1px;
}

ul {
  padding: revert;
}

li {
  line-height: 1.8;
  margin: 0;
  padding-inline-start: 1.5em;
  list-style-type: circle;
}
</style>
