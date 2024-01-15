import {metaData, utilities} from '@cornerstonejs/core';
import ptScalingMetaDataProvider from './ptScalingMetaDataProvider';

const { calibratedPixelSpacingMetadataProvider } = utilities;

export default function initProviders() {
  metaData.addProvider(
    ptScalingMetaDataProvider.get.bind(ptScalingMetaDataProvider),
    10000
  );
  metaData.addProvider(
    calibratedPixelSpacingMetadataProvider.get.bind(
      calibratedPixelSpacingMetadataProvider
    ),
    11000
  );
}
