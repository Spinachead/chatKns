<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NDropdown, useMessage } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { copyToClip } from '@/utils/copy'

interface Props {
  dateTime?: string
  text?: string
  inversion?: boolean
  error?: boolean
  loading?: boolean
  sources?: string[] // 添加sources字段
}

interface Emit {
  (ev: 'regenerate'): void
  (ev: 'delete'): void
  (ev: 'like'): void
  (ev: 'dislike'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const { isMobile } = useBasicLayout()

const { iconRender } = useIconRender()

const message = useMessage()

const textRef = ref<HTMLElement>()

const asRawText = ref(props.inversion)

const messageRef = ref<HTMLElement>()

// 点赞和点踩状态
const liked = ref(false)
const disliked = ref(false)

function handleLike() {
  liked.value = !liked.value
  if (liked.value) {
    disliked.value = false
  }
  emit('like')
}

function handleDislike() {
  disliked.value = !disliked.value
  if (disliked.value) {
    liked.value = false
  }
  emit('dislike')
}

const options = computed(() => {
  const common = [
    {
      label: t('chat.copy'),
      key: 'copyText',
      icon: iconRender({ icon: 'ri:file-copy-2-line' }),
    },
    {
      label: t('common.delete'),
      key: 'delete',
      icon: iconRender({ icon: 'ri:delete-bin-line' }),
    },
  ]

  if (!props.inversion) {
    common.unshift({
      label: asRawText.value ? t('chat.preview') : t('chat.showRawText'),
      key: 'toggleRenderType',
      icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }),
    })
  }

  return common
})

function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType') {
  switch (key) {
    case 'copyText':
      handleCopy()
      return
    case 'toggleRenderType':
      asRawText.value = !asRawText.value
      return
    case 'delete':
      emit('delete')
  }
}

function handleRegenerate() {
  messageRef.value?.scrollIntoView()
  emit('regenerate')
}

async function handleCopy() {
  try {
    await copyToClip(props.text || '')
    message.success(t('chat.copied'))
  }
  catch {
    message.error(t('chat.copyFailed'))
  }
}
</script>

<template>
  <div
    ref="messageRef"
    class="flex w-full mb-6 overflow-hidden"
    :class="[{ 'flex-row-reverse': inversion }]"
  >
    <div
      class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
      :class="[inversion ? 'ml-2' : 'mr-2']"
    >
      <AvatarComponent :image="inversion" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
        {{ dateTime }}
      </p>
      <div
        class="flex items-end gap-1 mt-2"
        :class="[inversion ? 'flex-row-reverse' : 'flex-row']"
      >
        <div class="flex flex-col">
          <TextComponent
            ref="textRef"
            :inversion="inversion"
            :error="error"
            :text="text"
            :loading="loading"
            :as-raw-text="asRawText"
            :sources="sources"
          />
          <!-- 底部操作按钮：点赞、点踩、重新生成 -->
          <div v-if="!inversion && !loading" class="flex items-center gap-4 mt-3 text-sm">
            <button
              class="flex items-center gap-1 transition-colors text-neutral-500 hover:text-blue-500 dark:hover:text-blue-400"
              @click="handleLike"
              title="{{ t('chat.like') }}"
            >
              <SvgIcon 
                :icon="liked ? 'ri:thumb-up-fill' : 'ri:thumb-up-line'" 
                :class="{ 'text-blue-500': liked }"
              />
            </button>
            <button
              class="flex items-center gap-1 transition-colors text-neutral-500 hover:text-red-500 dark:hover:text-red-400"
              @click="handleDislike"
              title="{{ t('chat.dislike') }}"
            >
              <SvgIcon 
                :icon="disliked ? 'ri:thumb-down-fill' : 'ri:thumb-down-line'" 
                :class="{ 'text-red-500': disliked }"
              />
            </button>
            <button
              class="flex items-center gap-1 transition-colors text-neutral-500 hover:text-green-500 dark:hover:text-green-400"
              @click="handleRegenerate"
              title="{{ t('chat.regenerate') }}"
            >
              <SvgIcon icon="ri:restart-line" />
            </button>
          </div>
        </div>
        <div class="flex flex-col">
          <NDropdown
            :trigger="isMobile ? 'click' : 'hover'"
            :placement="!inversion ? 'right' : 'left'"
            :options="options"
            @select="handleSelect"
          >
            <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown>
        </div>
      </div>
    </div>
  </div>
</template>