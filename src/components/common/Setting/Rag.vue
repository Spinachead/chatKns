<script lang="ts" setup>
import {onMounted, ref, computed} from 'vue'
import {NSelect, NSlider, NInputNumber, NSwitch} from 'naive-ui'
import {useSettingStore} from '@/store'
import {fetchListKnowledgeBases} from "@/api";

onMounted(() => {
	fetchKnowledgeBase()
})

const settingStore = useSettingStore()
const kb_name = ref(settingStore.kb_name ?? '')
const top_k = ref(settingStore.top_k ?? 3)
const scoreThreshold = ref(settingStore.score_threshold ?? 2.0)
const returnDirect = ref(settingStore.return_direct ?? false)
const baseOptions = ref([])

// 创建一个计算属性来转换 baseOptions 的格式
const formattedBaseOptions = computed(() => {
	const options = baseOptions.value.map((item: any) => ({
		label: item.kb_name,
		value: item.kb_name
	}))
	return options
})

//获取知识库
function fetchKnowledgeBase() {
	fetchListKnowledgeBases().then(res => {
		baseOptions.value = res.data
	})
}
</script>

<template>
	<div class="p-4 space-y-5 min-h-[200px]">
		<div class="space-y-6">
			<div class="flex items-center space-x-4">
				<span class="flex-shrink-0 w-[120px]">{{ $t('setting.knowledgeBaseName') }}</span>
				<div class="flex flex-wrap items-center gap-4">
					<NSelect
						style="width: 140px"
						v-model:value="kb_name"
						:options="formattedBaseOptions"
						@update-value="value => settingStore.setKbName(value)"
					/>
				</div>
			</div>

			<div class="flex items-center space-x-4">
				<span class="flex-shrink-0 w-[120px]">{{ $t('setting.topK') }}</span>
				<div class="flex-1">
					<NInputNumber v-model:value="top_k" :min="0" :max="10" @update-value="value => settingStore.setTopk(value)"></NInputNumber>
				</div>
			</div>
			<div class="flex items-center space-x-4">
				<span class="flex-shrink-0 w-[120px]">{{ $t('setting.scoreThreshold') }}</span>
				<div class="flex-1">
					<NSlider v-model:value="scoreThreshold" :max="2.0" :min="0.0" :step="0.1" @update-value="value => settingStore.setScoreThreshold(value)"></NSlider>
				</div>
			</div>
			<div class="flex items-center space-x-4">
				<span class="flex-shrink-0 w-[120px]">{{ $t('setting.scoreThreshold') }}</span>
				<div class="flex-1">
					<NSwitch v-model:value="returnDirect" @update-value="value => settingStore.setReturnDirect(value)"></NSwitch>
				</div>
			</div>
		</div>
	</div>
</template>
