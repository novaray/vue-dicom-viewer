<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { cache, Enums, RenderingEngine, type Types } from '@cornerstonejs/core';
import { addManipulationBindings, createImageIdsAndCacheMetaData } from '@/helpers/dicom';
import {
  addTool, AngleTool, ArrowAnnotateTool, BidirectionalTool, CircleROITool, CobbAngleTool, EllipticalROITool, Enums as csToolsEnums,
  KeyImageTool, LengthTool, LivewireContourTool, PanTool, PlanarFreehandROITool, ProbeTool, RectangleROITool, removeTool,
  StackScrollMouseWheelTool, StackScrollTool,
  ToolGroupManager,
  VideoRedactionTool, ZoomTool
} from '@cornerstonejs/tools';
// import { annotationModifiedListener } from '@cornerstonejs/tools/dist/cjs/eventListeners';
import type { IToolGroup } from '@cornerstonejs/tools/dist/cjs/types';
import { onBeforeRouteLeave } from 'vue-router';

const {ViewportType, Events} = Enums;
const {MouseBindings, KeyboardBindings, Events: toolsEvents} = csToolsEnums;
const toolGroupId = 'VIDEO_TOOL_GROUP_ID';
const viewportId = 'VIDEO_TOOL_VIEWPORT_ID';

const toolsNames = [
  LengthTool.toolName,
  KeyImageTool.toolName,
  ProbeTool.toolName,
  RectangleROITool.toolName,
  EllipticalROITool.toolName,
  CircleROITool.toolName,
  BidirectionalTool.toolName,
  AngleTool.toolName,
  CobbAngleTool.toolName,
  ArrowAnnotateTool.toolName,
  PlanarFreehandROITool.toolName,
  VideoRedactionTool.toolName,
  LivewireContourTool.toolName,
];

const renderingEngineId = 'videoToolsRenderingEngine';
const renderingEngine = reactive(new RenderingEngine(renderingEngineId));

const selectedToolName = ref<string>(toolsNames[0]);
const viewport = ref<Types.IVideoViewport>();
const divTag = ref<HTMLDivElement | null>(null);
const toggle = ref(true);

const currentTime = ref('0s');
const remainingTime = ref('0s');
const range = ref(0);
const rangeMax = ref(100);

const getToggleText = computed(() => toggle.value ? 'Play' : 'Pause');

const run = async (element: HTMLDivElement) => {
  // Init Cornerstone and related libraries

  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID: '2.25.96975534054447904995905761963464388233',
    SeriesInstanceUID: '2.25.15054212212536476297201250326674987992',
    wadoRsRoot: 'https://d33do7qe4w26qo.cloudfront.net/dicomweb',
  });

  // Only one SOP instances is DICOM, so find it
  const videoId = imageIds.find(
    (it: string) => it.indexOf('2.25.179478223177027022014772769075050874231') !== -1
  );

  // addAnnotationListeners();

  // Add annotation tools to Cornerstone3D
  addTool(KeyImageTool);
  addTool(ProbeTool);
  addTool(RectangleROITool);
  addTool(EllipticalROITool);
  addTool(CircleROITool);
  addTool(BidirectionalTool);
  addTool(AngleTool);
  addTool(CobbAngleTool);
  addTool(ArrowAnnotateTool);
  addTool(PlanarFreehandROITool);
  addTool(VideoRedactionTool);
  addTool(LivewireContourTool);

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId) as IToolGroup;
  addManipulationBindings(toolGroup);

  // Add tools to the tool group
  toolGroup.addTool(KeyImageTool.toolName);
  toolGroup.addTool(ProbeTool.toolName);
  toolGroup.addTool(RectangleROITool.toolName);
  toolGroup.addTool(EllipticalROITool.toolName);
  toolGroup.addTool(CircleROITool.toolName);
  toolGroup.addTool(BidirectionalTool.toolName);
  toolGroup.addTool(AngleTool.toolName);
  toolGroup.addTool(CobbAngleTool.toolName);
  toolGroup.addTool(ArrowAnnotateTool.toolName);
  toolGroup.addTool(PlanarFreehandROITool.toolName);
  toolGroup.addTool(VideoRedactionTool.toolName);
  toolGroup.addTool(LivewireContourTool.toolName);

  toolGroup.setToolActive(KeyImageTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary,
        modifierKey: KeyboardBindings.ShiftAlt,
      },
    ],
  });
  toolGroup.setToolActive(LengthTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Middle Click
      },
    ],
  });

  // Create a stack viewport
  const viewportInput = {
    viewportId,
    type: ViewportType.VIDEO,
    element,
    defaultOptions: {
      background: <Types.Point3> [0.2, 0, 0.2],
    },
  };

  renderingEngine.enableElement(viewportInput);

  // Get the stack viewport that was created
  viewport.value = renderingEngine.getViewport(viewportId) as Types.IVideoViewport;
  toolGroup.addViewport(viewportId, renderingEngineId);

  // Set the stack on the viewport
  await viewport.value.setVideo(videoId);

  const seconds = (time: number) => `${Math.round(time * 10) / 10} s`;

  element.addEventListener(Enums.Events.IMAGE_RENDERED, (evt: any) => {
    const { time, duration } = evt.detail;
    range.value = time;
    rangeMax.value = duration;
    currentTime.value = seconds(time);
    remainingTime.value = seconds(duration - time);
  });
};

// TODO 배포시에 문제되서 추후 확인.
// const addAnnotationListeners = () => {
//   eventTarget.addEventListener(
//     toolsEvents.ANNOTATION_SELECTION_CHANGE,
//     annotationModifiedListener
//   );
//   eventTarget.addEventListener(
//     toolsEvents.ANNOTATION_MODIFIED,
//     annotationModifiedListener
//   );
//   eventTarget.addEventListener(
//     toolsEvents.ANNOTATION_COMPLETED,
//     annotationModifiedListener
//   );
// };

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

const onTogglePlay = (newToggle: boolean) => {
  newToggle ? viewport.value!.pause() : viewport.value!.play();
  toggle.value = newToggle;
};

const onChangeRange = () => {
  // @ts-ignore
  viewport.value?.setTime(+range.value);
};

const onInputRange = () => {
  // @ts-ignore
  viewport.value?.setTime(+range.value);
};

onMounted(() => {
  const content = divTag.value;
  const element = document.createElement('div');
  element.id = 'cornerstone-video-tools-element';
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);
  addCameraModifiedHandler(element);

  run(element);
});

const addCameraModifiedHandler = (element: HTMLDivElement) => {
  const info = document.createElement('div');
  divTag.value!.appendChild(info);

  const rotationInfo = document.createElement('div');
  info.appendChild(rotationInfo);

  const flipHorizontalInfo = document.createElement('div');
  info.appendChild(flipHorizontalInfo);

  const flipVerticalInfo = document.createElement('div');
  info.appendChild(flipVerticalInfo);

  element.addEventListener(Events.CAMERA_MODIFIED, (_) => {
    if (!viewport.value) {
      return;
    }

    const {flipHorizontal, flipVertical} = viewport.value.getCamera();
    const {rotation} = viewport.value.getProperties();

    rotationInfo.innerText = `Rotation: ${Math.round(rotation!)}`;
    flipHorizontalInfo.innerText = `Flip horizontal: ${flipHorizontal}`;
    flipVerticalInfo.innerText = `Flip vertical: ${flipVertical}`;
  });
};

onBeforeRouteLeave(() => {
  ToolGroupManager.destroyToolGroup(toolGroupId);
  removeTool(LengthTool);
  removeTool(KeyImageTool);
  removeTool(ProbeTool);
  removeTool(RectangleROITool);
  removeTool(EllipticalROITool);
  removeTool(CircleROITool);
  removeTool(BidirectionalTool);
  removeTool(AngleTool);
  removeTool(CobbAngleTool);
  removeTool(ArrowAnnotateTool);
  removeTool(PlanarFreehandROITool);
  removeTool(VideoRedactionTool);
  removeTool(LivewireContourTool);
  removeTool(StackScrollMouseWheelTool);
  removeTool(PanTool);
  removeTool(ZoomTool);
  removeTool(StackScrollTool);
  cache.purgeCache();

  // TODO destory가 에러를 뱉어내서 잠시 주석. 다음 링크에서 답변 온다면 확인할 것.
  // https://github.com/cornerstonejs/cornerstone3D/issues/1001
  // renderingEngine?.destroy();
});
</script>

<template>
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
    <button @click="onTogglePlay(!toggle)">
      {{ getToggleText }}
    </button>
    <div ref="divTag"/>
    <div
      id="time"
      style="float:left;width:2.5em;"
    >
      {{currentTime}}
    </div>
    <input
      style="width:400px;height:8px;float: left"
      type="range"
      step="0.1"
      v-model="range"
      @change="onChangeRange"
      @input="onInputRange"
      :max="rangeMax"
    />
    <div>
      {{remainingTime}}
    </div>
  </div>
</template>
