<script setup lang="ts">
import {onMounted, ref, computed, h} from 'vue'
import {
	NCard,
	NUpload,
	NUploadDragger,
	NButton,
	NIcon,
	NSwitch,
	NSelect,
	NForm,
	NFormItem,
	NInput,
	FormInst,
	FormRules,
	NModal,
	NInputNumber,
	NDataTable,
	UploadFileInfo
} from 'naive-ui'
import {UploadFilled} from '@vicons/material'
import {t} from '@/locales'
import {fetchListFiles, fetchListKnowledgeBases} from "@/api";
import {useMessage} from 'naive-ui'

onMounted(() => {
	fetchKnowledgeBase()
	baseListFiles()
})

interface ModelType {
	knowledge_base_name: string | null
	description: string | null
	type: string | null
	embedding_model: string | null
}

const chunkSize = ref(750)
const chunkOverlap = ref(150)
const active = ref(false)
const pagination = {pageSize: 10}
const message = useMessage()
const showCreate = ref(false)
const currentKnowledgeBase = ref<any>(null)
const rules: FormRules = {
	knowledge_base_name: [{required: true, message: '请选择知识库名称'}],
	type: [{required: true, message: '请选择向量库类型'}],
	embedding_model: [{required: true, message: '请选择Embeddings模型'}]
}
const formRef = ref<FormInst | null>(null)
const modelRef = ref<ModelType>({
	knowledge_base_name: null,
	description: null,
	type: null,
	embedding_model: null
})
const baseOptions = ref([])
const fileList = ref<UploadFileInfo[]>([])

// 表格列定义
const columns = [
	{
		title: "序号",
		key: "No"
	},
	{
		title: "文档名称",
		key: "file_name",
		align: "center"
	},
	{
		title: "文档加载器",
		key: "document_loader",
		align: "center"
	},
	{
		title: "分词器",
		key: "text_splitter",
		align: "center"
	},
	{
		title: "文档数量",
		key: "docs_count",
		align: "center"
	},
	{
		title: "源文件",
		key: "in_folder",
		align: "center",

	},
	{
		title: "向量库",
		key: "in_db",
		align: "center"
	},
	{
		title: "操作",
		key: "action",
		align: "center",
		render: (record: any) => {
			return h(
				"div",
				{
					class: "flex, justify-between"
				},
				[
					h(
						NButton,
						{
							type: "primary",
							size: "small",
							onClick: () => {
								console.log("下载")
							}
						},
						{
							default: () => "下载"
						}
					)
				]
			)
		}
	}
]
const tableData = ref([])
const faissOptions = [
	{
		label: 'faiss',
		value: 'faiss'
	},
	{
		label: 'chromadb',
		value: 'chromadb'
	},
]
const embeddingOptions = [
	{
		label: 'bg-em3',
		value: 'bg-em3'
	},
	{
		label: 'text-embedding-3-small',
		value: 'text-embedding-3-small'
	},
	{
		label: 'text-embedding-3-large',
		value: 'text-embedding-3-large'
	}
]


const handleUpload = (options: { file: UploadFileInfo }) => {
	// 实际的上传逻辑
	console.log("Uploading file:", options.file)
	// 这里可以调用 fetchUploadFile 或其他上传 API
}

// 添加文件校验函数
const beforeUpload = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
	const { file } = data

	// 校验文件大小 (例如限制为 10MB)
	const maxSize = 10 * 1024 * 1024
	if (file.file?.size > maxSize) {
		message.error(t('knowledge.fileSizeExceeded'))
		return false
	}

	// 校验文件格式 (允许的格式)
	const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md']
	const fileName = file.name.toLowerCase()
	const isAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext))

	if (!isAllowedExtension) {
		message.error(t('knowledge.fileTypeNotAllowed'))
		return false
	}
	return true
}

function createSubmit() {
	// e.preventDefault()
	formRef.value?.validate((errors) => {
		if (!errors) {
			console.log("提交成功")
			message.success('提交成功')
		} else {
			console.log("提交失败")
			message.error('验证失败')
		}
	})
}

// 创建一个计算属性来转换 baseOptions 的格式
const formattedBaseOptions = computed(() => {
	const options = baseOptions.value.map((item: any) => ({
		label: item.kb_name,
		value: item.id
	}))
	// 如果还没有选中任何项且有选项可用，则默认选中第一个
	if (options.length > 0 && currentKnowledgeBase.value === null) {
		currentKnowledgeBase.value = options[0].value
	}
	return options
})


function fetchKnowledgeBase() {
	fetchListKnowledgeBases().then(res => {
		baseOptions.value = res.data
	})
}

function baseListFiles() {
	fetchListFiles({knowledge_base_name: "samples"}).then(res => {
		console.log(res.data)
		tableData.value = res.data
	}).catch(err => {
		console.log(err)
	})
}

</script>

<template>
	<div class="h-full overflow-hidden">
		<div class="flex flex-col w-full h-full">
			<NCard :title="t('knowledge.manage')" class="flex-1 overflow-hidden">
				<div class="flex justify-between">
					<NButton @click="showCreate = true" type="primary">新建知识库</NButton>
					<div class="flex items-center">
						<div>当前知识库：</div>
						<NSelect v-model:value="currentKnowledgeBase" :options="formattedBaseOptions" style="width: 200px"></NSelect>
					</div>
					<NButton @click="showCreate = true" type="error">删除知识库</NButton>
				</div>

				<div class="flex flex-col h-full pt-4">
					<!-- 上传区域 -->
					<NUpload
						class="mb-6"
						:custom-request="handleUpload"
						:max="3"
						v-model:file-list="fileList"
						@before-upload="beforeUpload"
						@finish="() => {}"
					>
						<NUploadDragger>
							<div class="mb-2">
								<NIcon size="48" class="text-gray-400">
									<UploadFilled/>
								</NIcon>
							</div>
							<div class="mb-1">{{ t('knowledge.dragUpload') }}</div>
							<NButton size="small" type="primary">
								{{ t('knowledge.clickUpload') }}
							</NButton>
						</NUploadDragger>
					</NUpload>

					<div class="overflow-y-auto" v-if="false">
						<div class="text-lg font-bold mb-4">请输入知识库介绍</div>
						<NInput v-model:value="modelRef.description" type="textarea" @keydown.enter.prevent/>
					</div>

					<div class="overflow-y-auto pt-4">
						<div class="text-lg font-bold mb-4">文件处理配置</div>
						<div class="flex justify-between">
							<div class="flex items-center">
								<div class="pr-3">单文本最大长度:</div>
								<NInputNumber v-model:value="chunkSize" :min="0" placeholder="请输入"></NInputNumber>
							</div>
							<div class="flex items-center">
								<div class="pr-3">相邻文本重合度:</div>
								<NInputNumber v-model:value="chunkOverlap" :min="0" placeholder="请输入"></NInputNumber>
							</div>
							<div class="flex items-center">
								<div class="pr-3">开启中文标题加强:</div>
								<NSwitch v-model:value="active"/>
							</div>
						</div>
					</div>
					<div class="overflow-y-auto pt-8 w-full flex justify-center">
						<NButton type="primary" size="large">添加到知识库</NButton>
					</div>

					<div class="overflow-y-auto pt-4">
						<div class="text-lg font-bold mb-4">知识库中已有文件</div>
						<NDataTable :columns="columns" :data="tableData" :bordered="true" :pagination="pagination" striped></NDataTable>
					</div>
				</div>
				<NModal v-model:show="showCreate" preset="dialog" positive-text="确定" negative-text="取消"
								@positive-click="createSubmit" :show-icon="false">
					<NForm ref="formRef" :model="modelRef" :rules="rules">
						<NFormItem path="knowledge_base_name" label="新建知识库名称">
							<NInput v-model:value="modelRef.knowledge_base_name" @keydown.enter.prevent/>
						</NFormItem>
						<NFormItem path="description" label="知识库简介">
							<NInput v-model:value="modelRef.description" @keydown.enter.prevent/>
						</NFormItem>
						<NFormItem path="type" label="向量库类型">
							<NSelect v-model:value="modelRef.type" :options="faissOptions"/>
						</NFormItem>
						<NFormItem path="embedding_model" label="Embeddings模型">
							<NSelect v-model:value="modelRef.embedding_model" :options="embeddingOptions"/>
						</NFormItem>
					</NForm>
				</NModal>
			</NCard>
		</div>
	</div>
</template>

<style scoped>
:deep(.n-upload-trigger) {
	width: 100%;
}
</style>
