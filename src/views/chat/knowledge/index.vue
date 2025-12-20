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
	UploadFileInfo,
	NPopconfirm
} from 'naive-ui'
import {UploadFilled} from '@vicons/material'
import {t} from '@/locales'
import {
	createKnowledgeBase,
	deleteKnowledgeBase,
	fetchDeleteDocs,
	fetchListFiles,
	fetchListKnowledgeBases,
	fetchUploadFile
} from "@/api";
import {useMessage} from 'naive-ui'

onMounted(() => {
	fetchKnowledgeBase()
})

interface ModelType {
	knowledge_base_name: string
	kb_info: string
	vector_store_type: string
	embedding_model: string
}

const chunkSize = ref(750)
const chunkOverlap = ref(150)
const zh_title_enhance = ref(false)
const pagination = {pageSize: 10}
const message = useMessage()
const showCreate = ref(false)
const currentKnowledgeBase = ref<any>(null)
const rules: FormRules = {
	knowledge_base_name: [{required: true, message: '请选择知识库名称'}],
	vector_store_type: [{required: true, message: '请选择向量库类型'}],
	embedding_model: [{required: true, message: '请选择Embeddings模型'}]
}
const formRef = ref<FormInst | null>(null)
const modelRef = ref<ModelType>({
	knowledge_base_name: '',
	kb_info: '',
	vector_store_type: '',
	embedding_model: ''
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
		width: 150,
		render: (record: any) => {
			return h(
				"div",
				{
					class: "flex justify-center space-x-2"
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
					),
					h(
						NButton,
						{
							type: "error",
							size: "small",
							onClick: () => {
								deleteDocs(record)
							}
						},
						{
							default: () => "删除"
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
	const {file} = data

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

function createSubmit(e: MouseEvent) {
	e.preventDefault()
	formRef.value?.validate((errors) => {
		if (!errors) {
			createKnowledgeBase({
				knowledge_base_name: modelRef.value.knowledge_base_name,
				kb_info: modelRef.value.kb_info,
				vector_store_type: modelRef.value.vector_store_type,
				embed_model: modelRef.value.embedding_model
			}).then(res => {
				currentKnowledgeBase.value = modelRef.value.knowledge_base_name
				message.success(res.msg)
				baseListFiles()
				fetchKnowledgeBase()
				closeCreateForm()
			})
		} else {
			message.error('验证失败')
		}
	})
}

function closeCreateForm() {
	showCreate.value = false
	// 重置表单内容
	modelRef.value = {
		knowledge_base_name: '',
		kb_info: '',
		vector_store_type: '',
		embedding_model: ''
	}
	formRef.value?.restoreValidation()
}

// 创建一个计算属性来转换 baseOptions 的格式
const formattedBaseOptions = computed(() => {
	const options = baseOptions.value.map((item: any) => ({
		label: item.kb_name,
		value: item.kb_name
	}))
	// 如果还没有选中任何项且有选项可用，则默认选中第一个
	if (options.length > 0 && currentKnowledgeBase.value === null) {
		currentKnowledgeBase.value = options[0].value
	}
	return options
})

//获取知识库
function fetchKnowledgeBase() {
	fetchListKnowledgeBases().then(res => {
		baseOptions.value = res.data
		baseListFiles()
	})
}

//获取知识库内文件
function baseListFiles() {
	const base_name = currentKnowledgeBase.value === null ? 'samples' : currentKnowledgeBase.value
	fetchListFiles({knowledge_base_name: base_name}).then(res => {
		tableData.value = res.data
	}).catch(err => {
		console.log(err)
	})
}

//添加文件到知识库
function uploadFiles() {
	// 从 fileList 中提取实际的 File 对象
	const files = fileList.value
		.map(item => item.file)
		.filter(file => file !== undefined) as File[];

	fetchUploadFile({
		files: files,
		knowledge_base_name: currentKnowledgeBase.value,
		chunk_size: chunkSize.value,
		chunk_overlap: chunkOverlap.value,
		zh_title_enhance: zh_title_enhance.value
	}).then(res => {
		message.success(res.msg)
		baseListFiles()
	}).catch(err => {
		console.log(err)
	})
}

//删除知识库中的文件
function deleteDocs(item: any) {
	console.log("删除文件:", item)
	fetchDeleteDocs({
		knowledge_base_name: currentKnowledgeBase.value,
		file_names: [item.file_name],
		delete_content: true,
		not_refresh_vs_cache: true
	}).then(res => {
		message.success(res.msg)
		baseListFiles()
	})
}

function deleteKnBase() {
	deleteKnowledgeBase({
		knowledge_base_name: currentKnowledgeBase.value
	}).then(res => {
		message.success(res.msg)
		currentKnowledgeBase.value = null
		fetchKnowledgeBase()
	}).catch(err => {
		message.error(err.msg)
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
						<NSelect v-model:value="currentKnowledgeBase" :options="formattedBaseOptions"
										 :on-update-value="baseListFiles" style="width: 200px"></NSelect>
					</div>
					<NPopconfirm @positive-click="deleteKnBase">
						<template #trigger>
							<NButton type="error">删除知识库</NButton>
						</template>
						<template #default>
							<div>确定要删除当前知识库吗？ 删除后该知识库内所有文件将被删除</div>
						</template>
					</NPopconfirm>
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
						<NInput v-model:value="modelRef.kb_info" type="textarea" @keydown.enter.prevent/>
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
								<NSwitch v-model:value="zh_title_enhance"/>
							</div>
						</div>
					</div>
					<div class="overflow-y-auto pt-8 w-full flex justify-center">
						<NButton type="primary" size="large" @click="uploadFiles">添加到知识库</NButton>
					</div>

					<div class="overflow-y-auto pt-4">
						<div class="text-lg font-bold mb-4">知识库中已有文件</div>
						<NDataTable :columns="columns" :data="tableData" :bordered="true" :pagination="pagination"
												striped></NDataTable>
					</div>
				</div>
				<NModal v-model:show="showCreate">
					<NCard title="新建知识库" style="width: 600px" :bordered="true">
						<NForm ref="formRef" :model="modelRef" :rules="rules">
							<NFormItem path="knowledge_base_name" label="新建知识库名称">
								<NInput v-model:value="modelRef.knowledge_base_name" placeholder="暂不支持中文" @keydown.enter.prevent/>
							</NFormItem>
							<NFormItem path="kb_info" label="知识库简介">
								<NInput v-model:value="modelRef.kb_info" @keydown.enter.prevent/>
							</NFormItem>
							<NFormItem path="type" label="向量库类型">
								<NSelect v-model:value="modelRef.vector_store_type" :options="faissOptions"/>
							</NFormItem>
							<NFormItem path="embedding_model" label="Embeddings模型">
								<NSelect v-model:value="modelRef.embedding_model" :options="embeddingOptions"/>
							</NFormItem>
							<NFormItem>
								<div class="flex space-x-2 justify-end w-full">
									<NButton attr-type="button" @click="closeCreateForm">取消</NButton>
									<NButton attr-type="button" type="primary" @click="createSubmit">创建</NButton>
								</div>
							</NFormItem>
						</NForm>
					</NCard>
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
