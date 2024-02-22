<script setup lang="ts">
import { wadouri } from '@cornerstonejs/dicom-image-loader';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { convertMultiframeImageIds } from '@/helpers/dicom';
import {
  addTool, PanTool, removeTool, StackScrollMouseWheelTool, ToolGroupManager, utilities, WindowLevelTool, ZoomTool
} from '@cornerstonejs/tools';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { MouseBindings } from '@cornerstonejs/tools/dist/cjs/enums';
import { cache, RenderingEngine, type Types } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/src/enums';
import JSZip from 'jszip';
import CommonLoadingSpinner from '@/components/common/CommonLoadingSpinner.vue';
import { onBeforeRouteLeave } from 'vue-router';

interface Props {
  file?: File;
}
const props = defineProps<Props>();

watch(() => props.file, (file) => {
  if (!file) {
    return;
  }

  onChangeFile({target: {files: [file]}});
});

interface UnzipFile {
  name: string;
  imageId: string | undefined;
}

const zip = new JSZip();

const toolGroupId = 'unzipToolGroup';

const divTag = ref<HTMLDivElement | null>(null);
const viewport = ref<Types.IViewport>();

// Instantiate a rendering engine
const renderingEngineId = 'unzipRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));

const metadata = ref<{
  info: string,
  value: any
}[]>([]);
const uploadedFiles = ref<UnzipFile[]>([]);
const unzipLoading = ref(false);
const fileMatchingLoading = ref(false);
const stacks = ref<any[]>([]);
const totalFiles = ref(0);

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
  const viewportId = 'CT_STACK_UNZIP';
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

const onChangeFile = (event: { target: { files?: File[] } }) => {
  const files = event.target.files;
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
       totalFiles.value = files.length;

       const promises = files.map((zipEntry) => {
         return zipEntry.async('blob')
                        .then((blob: Blob) => {
                          const imageId = wadouri.fileManager.add(blob);
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
     .then((unzipFiles: UnzipFile[]) => {
       uploadedFiles.value = unzipFiles;
       const imageIds = uploadedFiles.value.map((file) => file.imageId) as string[];
       return loadAndViewImage(imageIds);
     })
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
};

const loadAndViewImage = (imageIds: string[]) => {
  if (!viewport.value) {
    return;
  }

  stacks.value = convertMultiframeImageIds([...imageIds]);

  // @ts-ignore - Set the stack on the viewport
  viewport.value.setStack(stacks.value, 0).then((imageId: string) => {
    viewport.value!.render();
    utilities.stackPrefetch.enable(viewport.value?.element);
  });
};

const onClickFile = (index: number) => {
  if (!viewport.value) {
    return;
  }

  metadata.value.length = 0;
  // @ts-ignore
  viewport.value.setStack(stacks.value, index).then(() => viewport.value!.render());
};

onMounted(run);

onBeforeRouteLeave(() => {
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
    <div style="margin-left: 1rem;">
      <h3>Total files: {{totalFiles}}</h3>
      <div class="file-list-wrap">
        <CommonLoadingSpinner
          v-show="isLoading"
          :text="getLoadingText"
        />
        <ul v-show="!unzipLoading">
          <li
            :class="getListClass"
            v-for="(file, index) in uploadedFiles"
            :key="file.name"
            @click="onClickFile(index)"
          >
            {{ file.name }}
          </li>
        </ul>
      </div>
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

.file-list-wrap {
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
