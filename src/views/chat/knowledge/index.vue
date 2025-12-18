<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NUpload, NUploadDragger, NButton, NIcon,NSwitch,NSelect, NForm, NFormItem, NInput, FormInst, FormRules,NModal,NInputNumber, NDataTable } from 'naive-ui'
import { UploadFilled } from '@vicons/material'
import { t } from '@/locales'
import {fetchUploadFile} from "@/api";
import { useMessage } from 'naive-ui'

interface KnowledgeFile {
  id: string
  name: string
  size: string
  date: string
}

const fileList = ref<KnowledgeFile[]>([
  { id: '1', name: '产品介绍文档.pdf', size: '2.4 MB', date: '2023-12-01' },
  { id: '2', name: '技术规范书.docx', size: '1.2 MB', date: '2023-11-28' },
  { id: '3', name: '用户手册.txt', size: '0.8 MB', date: '2023-11-25' },
])

// 表格列定义
const columns = [
  {
    title: "序号",
    key: "index"
  },
  {
    title: "文档名称",
    key: "fileName"
  },
  {
    title: "文档加载器",
    key: "loader"
  },
  {
    title: "分词器",
    key: "tokenizer"
  },
  {
    title: "文档数量",
    key: "docCount"
  },
  {
    title: "源文件",
    key: "source"
  }
]

// 表格数据
const tableData = ref([
  {
    index: 1,
    fileName: "公司介绍文档.pdf",
    loader: "PDFLoader",
    tokenizer: "jieba",
    docCount: 128,
    source: "本地上传"
  },
  {
    index: 2,
    fileName: "产品说明书.docx",
    loader: "DocxLoader",
    tokenizer: "pkuseg",
    docCount: 96,
    source: "系统生成"
  },
  {
    index: 3,
    fileName: "FAQ.txt",
    loader: "TextLoader",
    tokenizer: "THULAC",
    docCount: 256,
    source: "手动录入"
  },
  {
    index: 4,
    fileName: "API文档.html",
    loader: "HTMLLoader",
    tokenizer: "StanfordSegmenter",
    docCount: 64,
    source: "网页抓取"
  },
  {
    index: 5,
    fileName: "用户反馈.xlsx",
    loader: "ExcelLoader",
    tokenizer: "HanLP",
    docCount: 201,
    source: "数据导入"
  }
])

const handleUpload = (options: { file: any }) => {
  const { file } = options
  // 模拟上传过程
  // return new Promise<void>((resolve) => {
  //   setTimeout(() => {
  //     fileList.value.unshift({
  //       id: Date.now().toString(),
  //       name: file.name,
  //       size: `${(file.file.size / 1024 / 1024).toFixed(1)} MB`,
  //       date: new Date().toLocaleDateString()
  //     })
  //     resolve()
  //   }, 1000)
  // })
	console.log("这是file", file)


	fetchUploadFile(
		{files: file.file, knowledge_base_name: 'samples'}
	).then(res => {
		console.log(res)
	}).catch(err => {
		console.log(err)
	})

}

const handleDelete = (id: string) => {
  const index = fileList.value.findIndex(file => file.id === id)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}
const message = useMessage()
const showCreate = ref(false)
const currentKnowledgeBase = ref<any>(null)

const baseOptions = [
  {
    label: 'samples',
    value: 'samples'
  },
  {
    label: '公司助手',
    value: '公司助手'
  },
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

const rules: FormRules = {
	knowledge_base_name: [{required: true, message: '请选择知识库名称'}],
	type: [{required: true, message: '请选择向量库类型'}],
	embedding_model: [{required: true, message: '请选择Embeddings模型'}]
}
const formRef = ref<FormInst|null>(null)
interface ModelType {
	knowledge_base_name: string | null
	description: string | null
	type: string | null
	embedding_model: string | null
}
const modelRef = ref<ModelType>({
		knowledge_base_name: null,
		description: null,
		type: null,
		embedding_model: null
})

function createSubmit() {
	// e.preventDefault()
	formRef.value?.validate((errors) => {
		if (!errors) {
			console.log("提交成功")
			message.success('提交成功')
		}else {
			console.log("提交失败")
			message.error('验证失败')
		}
	})
}
const chunkSize = ref(750)
const chunkOverlap = ref(150)

const active = ref(false)
const pagination = {pageSize: 10}
</script>

<template>
  <div class="h-full overflow-hidden">
    <div class="flex flex-col w-full h-full">
      <NCard :title="t('knowledge.manage')" class="flex-1 overflow-hidden">
				<div class="flex justify-between">
					<NButton @click="showCreate = true" type="primary">新建知识库</NButton>
					<div class="flex items-center">
						<div>当前知识库：</div>
						<NSelect v-model:value="currentKnowledgeBase" :options="baseOptions" style="width: 200px"></NSelect>
					</div>
					<NButton @click="showCreate = true" type="error">删除知识库</NButton>
				</div>

        <div class="flex flex-col h-full pt-4">
          <!-- 上传区域 -->
          <NUpload
            class="mb-6"
            :custom-request="handleUpload"
            :max="1"
            @finish="() => {}"
          >
            <NUploadDragger>
              <div class="mb-2">
                <NIcon size="48" class="text-gray-400">
                  <UploadFilled />
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
						<NInput v-model:value="modelRef.description" type="textarea" @keydown.enter.prevent />
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
								<NSwitch v-model:value="active" />
							</div>
						</div>
					</div>
					<div class="overflow-y-auto pt-8 w-full flex justify-center">
						<NButton type="primary" size="large">添加到知识库</NButton>
					</div>

					<div class="overflow-y-auto pt-4">
						<div class="text-lg font-bold mb-4">知识库中已有文件</div>
						<NDataTable :columns="columns" :data="tableData" :bordered="true" :pagination="pagination"></NDataTable>
					</div>

        </div>
				<NModal v-model:show="showCreate" preset="dialog"  positive-text="确定" negative-text="取消" @positive-click="createSubmit" :show-icon="false">
					<NForm ref="formRef" :model="modelRef" :rules="rules">
						<NFormItem path="knowledge_base_name" label="新建知识库名称">
							<NInput v-model:value="modelRef.knowledge_base_name" @keydown.enter.prevent />
						</NFormItem>
						<NFormItem path="description" label="知识库简介">
							<NInput v-model:value="modelRef.description" @keydown.enter.prevent />
						</NFormItem>
						<NFormItem path="type" label="向量库类型">
							<NSelect v-model:value="modelRef.type" :options="faissOptions" />
						</NFormItem>
						<NFormItem path="embedding_model" label="Embeddings模型">
							<NSelect v-model:value="modelRef.embedding_model" :options="embeddingOptions" />
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
