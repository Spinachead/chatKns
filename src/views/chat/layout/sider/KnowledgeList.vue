<script setup lang='ts'>
import { onMounted, computed } from 'vue'
import { NPopconfirm, NScrollbar } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { useAppStore, useKnowledgeStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { debounce } from '@/utils/functions/debounce'

const { isMobile } = useBasicLayout()
const appStore = useAppStore()
const knowledgeStore = useKnowledgeStore()

// 从store获取知识库数据
const knowledgeBases = computed(() => knowledgeStore.knowledgeBases)

// 从store获取当前选中的知识库
const currentKnowledgeBase = computed(() => knowledgeStore.currentKnowledgeBase)

// 处理知识库选中
async function handleSelect(kb: any) {
  if (isActive(kb.kb_name))
    return
  
  // 更新store中的当前知识库
  await knowledgeStore.setCurrentKnowledgeBase(kb.kb_name)
  
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

// 处理知识库删除
async function handleDelete(index: number, event?: MouseEvent | TouchEvent) {
  event?.stopPropagation()
  // 这里可以添加删除逻辑，实际项目中应调用store的方法
  console.log('删除知识库:', knowledgeBases.value[index])
  
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

const handleDeleteDebounce = debounce(handleDelete, 600)

// 检查知识库是否被选中
function isActive(kbName: string) {
  return currentKnowledgeBase.value === kbName
}

// 初始化获取知识库列表
onMounted(() => {
  knowledgeStore.fetchKnowledgeBases()
})


</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!knowledgeBases.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:database-2-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="(kb, index) of knowledgeBases" :key="kb.id">
          <a
            class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
            :class="isActive(kb.kb_name) && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]', 'pr-14']"
            @click="handleSelect(kb)"
          >
            <span>
              <SvgIcon icon="ri:database-2-line" />
            </span>
            <div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
              <span>{{ kb.kb_name }}</span>
            </div>
          </a>
        </div>
      </template>
    </div>
  </NScrollbar>
</template>