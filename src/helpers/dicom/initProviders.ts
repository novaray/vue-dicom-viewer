import {metaData, utilities} from '@cornerstonejs/core';
import { get, addInstance } from './ptScalingMetaDataProvider';

const { calibratedPixelSpacingMetadataProvider } = utilities;

export function initProviders() {
  metaData.addProvider(
    get.bind({
      addInstance,
      get
    }),
    10000
  );
  metaData.addProvider(
    calibratedPixelSpacingMetadataProvider.get.bind(
      calibratedPixelSpacingMetadataProvider
    ),
    11000
  );
}
