import { defineStore } from 'pinia'
import type { SettingsState } from './helper'
import { defaultSetting, getLocalState, removeLocalState, setLocalState } from './helper'

export const useSettingStore = defineStore('setting-store', {
  state: (): SettingsState => getLocalState(),
  actions: {
    updateSetting(settings: Partial<SettingsState>) {
      this.$state = { ...this.$state, ...settings }
      this.recordState()
    },

    resetSetting() {
      this.$state = defaultSetting()
      removeLocalState()
    },
		setKbName(kbName: string) {
			if (this.kb_name !== kbName) {
				this.kb_name = kbName
				this.recordState()
			}
		},
		setTopk(top_k: number) {
			this.top_k = top_k
			this.recordState()
		},
		setScoreThreshold(score_threshold: number) {
			this.score_threshold = score_threshold
			this.recordState()
		},
		setReturnDirect(return_direct: boolean) {
			this.return_direct = return_direct
			this.recordState()
		},

    recordState() {
      setLocalState(this.$state)
    },
  },
})
