import { defineStore } from 'pinia';

export interface CommonFilePassPopupDialogStore {
  visible: boolean;
  handleSuccess: (text: string) => void;
  handleClose: () => void;
}

export const useCommonFilePassPopupDialogStore = defineStore('CommonFilePassPopupDialogStore', {
  state: (): CommonFilePassPopupDialogStore => ({
    visible: false,
    handleClose: () => {},
    handleSuccess: () => {}
  }),
  actions: {
    open() {
      this.visible = true;
    },
    close() {
      this.visible = false;
    }
  },
});
