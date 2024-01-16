import { initProviders } from './initProviders';
import { initCornerstoneDICOMImageLoader } from './initCornerstoneDICOMImageLoader';
import { initVolumeLoader } from './initVolumeLoader';
import { init as csRenderInit } from '@cornerstonejs/core';
import { init as csToolsInit } from '@cornerstonejs/tools';

export async function initDicom() {
  initProviders();
  initCornerstoneDICOMImageLoader();
  initVolumeLoader();
  await csRenderInit();
  await csToolsInit();
  return true;
}
