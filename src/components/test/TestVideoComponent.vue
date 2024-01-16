<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Enums, getRenderingEngine, RenderingEngine, type Types } from '@cornerstonejs/core';
import { addButtonToToolbar, createImageIdsAndCacheMetaData } from '@/helpers/dicom';

const {ViewportType, Events} = Enums;

const renderingEngineId = 'myRenderingEngine';
const viewportId = 'videoViewport';

const divTag = ref<HTMLDivElement | null>(null);

onMounted( () => {
  const content = divTag.value;
  const element = document.createElement('div');
  element.id = 'cornerstone-element';
  element.style.width = '500px';
  element.style.height = '500px';

  content!.appendChild(element);

  const info = document.createElement('div');
  content!.appendChild(info);

  const rotationInfo = document.createElement('div');
  info.appendChild(rotationInfo);

  const flipHorizontalInfo = document.createElement('div');
  info.appendChild(flipHorizontalInfo);

  const flipVerticalInfo = document.createElement('div');
  info.appendChild(flipVerticalInfo);

  element.addEventListener(Events.CAMERA_MODIFIED, (_) => {
    // Get the rendering engine
    const renderingEngine = getRenderingEngine(renderingEngineId);

    // Get the stack viewport
    const viewport = <Types.IStackViewport> (
      renderingEngine!.getViewport(viewportId)
    );

    if (!viewport) {
      return;
    }

    const {flipHorizontal, flipVertical} = viewport.getCamera();
    const {rotation} = viewport.getProperties();

    rotationInfo.innerText = `Rotation: ${Math.round(rotation!)}`;
    flipHorizontalInfo.innerText = `Flip horizontal: ${flipHorizontal}`;
    flipVerticalInfo.innerText = `Flip vertical: ${flipVertical}`;
  });

  addButtonToToolbar({
    id: 'play-button',
    title: 'Play',
    onClick: () => {
      // Get the rendering engine
      const renderingEngine = getRenderingEngine(renderingEngineId);

      // Get the stack viewport
      const viewport = <Types.IVideoViewport> (
        renderingEngine!.getViewport(viewportId)
      );

      // Set a range to highlight bones
      viewport.play();
    }
  });

  addButtonToToolbar({
    id: 'pause-button',
    title: 'Pause',
    onClick: () => {
      // Get the rendering engine
      const renderingEngine = getRenderingEngine(renderingEngineId);

      // Get the stack viewport
      const viewport = <Types.IVideoViewport> (
        renderingEngine!.getViewport(viewportId)
      );

      // Set a range to highlight bones
      viewport.pause();
    }
  });

  async function run() {
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

    // Instantiate a rendering engine
    const renderingEngine = new RenderingEngine(renderingEngineId);

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
    const viewport = <Types.IVideoViewport> (
      renderingEngine.getViewport(viewportId)
    );

    // Set the stack on the viewport
    await viewport.setVideo(videoId);

    // Set the VOI of the stack
    // viewport.setProperties({ voiRange: ctVoiRange });

    // Render the image
    viewport.play();
  }

  run();
});
</script>

<template>
  <div id="demo-toolbar"/>
  <div ref="divTag"/>
</template>
