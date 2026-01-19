<script setup lang="ts">
import {onMounted, ref, computed, h, watch} from 'vue'
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
	fetchUploadFile
} from "@/api";
import {useMessage} from 'naive-ui'
import {useAppStore, useKnowledgeStore} from '@/store'
import {SvgIcon} from '@/components/common'


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
const appStore = useAppStore()
const knowledgeStore = useKnowledgeStore()
const showCreate = ref(false)
// 上传中状态
const uploading = ref(false)

// 监听store中的showCreateKnowledgeBase状态变化
watch(
  () => appStore.showCreateKnowledgeBase,
  (newValue) => {
    showCreate.value = newValue
  },
  { immediate: true }
)

// 当弹窗关闭时，更新store中的状态
watch(
  showCreate,
  (newValue) => {
    if (!newValue) {
      appStore.setShowCreateKnowledgeBase(false)
    }
  }
)

// 从store获取当前知识库
const currentKnowledgeBase = computed(() => knowledgeStore.currentKnowledgeBase)


// 从store获取知识库列表用于判断是否为空
const knowledgeBases = computed(() => knowledgeStore.knowledgeBases)

// 从store获取知识库文件列表
const tableData = computed(() => knowledgeStore.knowledgeBaseFiles)

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
const fileList = ref<UploadFileInfo[]>([])

// 监听store中的currentKnowledgeBase变化，自动获取文件列表
watch(
  () => knowledgeStore.currentKnowledgeBase,
  (newValue) => {
    if (newValue) {
      // 当左侧选中知识库变化时，自动获取对应文件列表
      console.log('当前选中知识库变化:', newValue)
    }
  },
  { immediate: true }
)

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

async function createSubmit(e: MouseEvent) {
	e.preventDefault()
	formRef.value?.validate(async (errors) => {
		if (!errors) {
			try {
				const res = await createKnowledgeBase({
					knowledge_base_name: modelRef.value.knowledge_base_name,
					kb_info: modelRef.value.kb_info,
					vector_store_type: modelRef.value.vector_store_type,
					embed_model: modelRef.value.embedding_model
				})
				message.success(res.msg)
				// 创建成功后刷新知识库列表
				await knowledgeStore.fetchKnowledgeBases()
				// 设置当前知识库为新创建的知识库
				await knowledgeStore.setCurrentKnowledgeBase(modelRef.value.knowledge_base_name)
				closeCreateForm()
			} catch (err: any) {
				message.error(err.msg)
				console.log(err)
			}
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

//获取知识库
async function fetchKnowledgeBase() {
	await knowledgeStore.fetchKnowledgeBases()
}

//添加文件到知识库
async function uploadFiles() {
	// 从 fileList 中提取实际的 File 对象
	const files = fileList.value
		.map(item => item.file)
		.filter(file => file !== undefined) as File[];

	// 如果没有选择文件，直接返回
	if (files.length === 0) {
		message.warning('请先选择要上传的文件')
		return
	}

	try {
		// 设置上传中状态
		uploading.value = true
		// 显示上传中提示
		const uploadingMsg = message.loading('正在上传文件...', {
			duration: 0 // 不自动关闭
		})
		
		const res = await fetchUploadFile({
			files: files,
			knowledge_base_name: currentKnowledgeBase.value as string,
			chunk_size: chunkSize.value,
			chunk_overlap: chunkOverlap.value,
			zh_title_enhance: zh_title_enhance.value
		})
		// 关闭上传中提示
		uploadingMsg.destroy()
		message.success(res.msg)
		// 上传成功后刷新当前知识库的文件列表
		await knowledgeStore.refreshCurrentKnowledgeBaseFiles()
		// 清空文件列表
		fileList.value = []
	} catch (err: any) {
		// 关闭上传中提示
		message.error(err.msg || '文件上传失败')
		console.log(err)
	} finally {
		// 无论成功还是失败，都设置上传状态为false
		uploading.value = false
	}
}

//删除知识库中的文件
async function deleteDocs(item: any) {
	console.log("删除文件:", item)
	try {
		const res = await fetchDeleteDocs({
			knowledge_base_name: currentKnowledgeBase.value as string,
			file_names: [item.file_name],
			delete_content: true,
			not_refresh_vs_cache: true
		})
		message.success(res.msg)
		// 删除成功后刷新当前知识库的文件列表
		await knowledgeStore.refreshCurrentKnowledgeBaseFiles()
	} catch (err) {
		console.log(err)
	}
}

async function deleteKnBase() {
	try {
		const res = await deleteKnowledgeBase({
			knowledge_base_name: currentKnowledgeBase.value as string
		})
		message.success(res.msg)
		// 删除成功后刷新知识库列表
		await knowledgeStore.fetchKnowledgeBases()
		// 如果删除的是当前选中的知识库，则重新选择第一个知识库
		if (knowledgeStore.knowledgeBases.length > 0) {
			await knowledgeStore.setCurrentKnowledgeBase(knowledgeStore.knowledgeBases[0].kb_name)
		} else {
			knowledgeStore.currentKnowledgeBase = null
		}
	} catch (err: any) {
		message.error(err.msg)
		console.log(err)
	}
}
</script>

<template>
	<div class="h-full overflow-hidden">
		<div class="flex flex-col w-full h-full">
			<NCard :title="t('knowledge.manage')" class="flex-1 overflow-hidden">
				<!-- 当知识库列表为空时，只显示新建知识库内容 -->
				<div v-if="knowledgeBases.length === 0" class="relative">

					<div class="flex items-center justify-center mt-4 text-center text-neutral-300">
								<SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
								<span >{{ t('knowledge.create') }}</span>
					</div>
				</div>
				
				<!-- 当知识库列表不为空时，显示完整的知识库管理内容 -->
				<div v-else class="h-full">
					<div class="flex justify-end relative">
						<!-- 上传中图标，显示在右上角 -->
						<div v-if="uploading" class="absolute -top-2 -right-2">
							<NIcon size="20" class="text-blue-500 animate-spin">
								<UploadFilled/>
							</NIcon>
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

/* 旋转动画 */
.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
