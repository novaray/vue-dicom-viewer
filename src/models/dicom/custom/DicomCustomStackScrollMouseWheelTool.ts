import { getEnabledElement } from '@cornerstonejs/core';
import { BaseTool } from '@cornerstonejs/tools';
import type { MouseWheelEventType } from '@cornerstonejs/tools/dist/cjs/types/EventTypes';
import { scroll } from '@cornerstonejs/tools/dist/cjs/utilities';

/**
 * The StackScrollMouseWheelTool is a tool that allows the user to scroll through a stack of images using the mouse wheel
 * Warning: 사용하지 말 것. StackScrollMouseWheelTool과 같은 구조이나 vite에서 번들링시에 제대로 말아지지 않음.
 */
class DicomCustomStackScrollMouseWheelTool extends BaseTool {
  static toolName: string;
  
  _configuration: any;
  
  constructor(
    toolProps = {},
    defaultToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        invert: false,
        debounceIfNotLoaded: true,
        loop: false,
        scrollSlabs: false
      }
    }
  ) {
    super(toolProps, defaultToolProps);
  }
  
  mouseWheelCallback(evt: MouseWheelEventType): void {
    const {wheel, element} = evt.detail;
    const {direction} = wheel;
    const {invert} = this.configuration;
    const {viewport} = getEnabledElement(element)!;
    const delta = direction * (invert ? -1 : 1);
    
    const targetId = this.getTargetId(viewport);
    const volumeId = targetId!.split('volumeId:')[1];
    
    scroll(viewport, {
      delta,
      debounceLoading: this.configuration.debounceIfNotLoaded,
      loop: this.configuration.loop,
      volumeId,
      scrollSlabs: this.configuration.scrollSlabs
    });
  }
}

DicomCustomStackScrollMouseWheelTool.toolName = 'DicomCustomStackScrollMouseWheelTool';
export default DicomCustomStackScrollMouseWheelTool;
