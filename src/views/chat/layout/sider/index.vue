<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NButton, NLayoutSider, useDialog } from 'naive-ui'
import List from './List.vue'
import KnowledgeList from './KnowledgeList.vue'
import Footer from './Footer.vue'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { PromptStore, SvgIcon } from '@/components/common'
import { t } from '@/locales'
import { useRoute } from 'vue-router'

const appStore = useAppStore()
const chatStore = useChatStore()
const route = useRoute()

const dialog = useDialog()

const { isMobile } = useBasicLayout()
const show = ref(false)

const collapsed = computed(() => appStore.siderCollapsed)

function handleAdd() {
  chatStore.addHistory({ title: t('chat.newChatTitle'), uuid: Date.now(), isEdit: false })
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

// 添加新知识库
function handleAddKnowledge() {
  appStore.setShowCreateKnowledgeBase(true)
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

function handleClearAll() {
  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.clearHistoryConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearHistory()
      if (isMobile.value)
        appStore.setSiderCollapsed(true)
    },
  })
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)

// 检测当前是否是知识库路由
const isKnowledgeRoute = computed(() => route.name === 'Knowledge')
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="260"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
    position="static"
    bordered
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full" :style="mobileSafeArea">
      <main class="flex flex-col flex-1 min-h-0">
        <!-- 聊天模式 -->
        <template v-if="!isKnowledgeRoute">
          <div class="p-4">
            <NButton dashed block @click="handleAdd">
              {{ $t('chat.newChatButton') }}
            </NButton>
          </div>
          <div class="flex-1 min-h-0 pb-4 overflow-hidden">
            <List />
          </div>
          <div class="flex items-center p-4 space-x-4">
            <div class="flex-1">
              <NButton block @click="show = true">
                {{ $t('store.siderButton') }}
              </NButton>
            </div>
            <NButton @click="handleClearAll">
              <SvgIcon icon="ri:close-circle-line" />
            </NButton>
          </div>
        </template>
        
        <!-- 知识库模式 -->
        <template v-else>
          <div class="p-4">
            <NButton dashed block @click="handleAddKnowledge">
              新建知识库
            </NButton>
          </div>
          <div class="flex-1 min-h-0 pb-4 overflow-hidden">
            <KnowledgeList />
          </div>
        </template>
      </main>
      <Footer />
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 w-full h-full bg-black/40" @click="handleUpdateCollapsed" />
  </template>
  <PromptStore v-model:visible="show" />
</template>