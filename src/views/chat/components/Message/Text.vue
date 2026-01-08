<script lang="ts" setup>
import { computed, onMounted, onUnmounted, onUpdated, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import MdKatex from '@vscode/markdown-it-katex'
import MdLinkAttributes from 'markdown-it-link-attributes'
import MdMermaid from 'mermaid-it-markdown'
import hljs from 'highlight.js'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'
import { copyToClip } from '@/utils/copy'

interface Props {
  inversion?: boolean
  error?: boolean
  text?: string
  loading?: boolean
  asRawText?: boolean
  sources?: string[] // 添加sources字段
}

const props = defineProps<Props>()

const { isMobile } = useBasicLayout()

const textRef = ref<HTMLElement>()
const sourcesRef = ref<HTMLElement>()

// 存储事件处理函数的引用，以便稍后移除
const copyEventHandlers = new Map<HTMLElement, () => void>()

const mdi = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language))
    if (validLang) {
      const lang = language ?? ''
      return highlightBlock(hljs.highlight(code, { language: lang }).value, lang)
    }
    return highlightBlock(hljs.highlightAuto(code).value, '')
  },
})

mdi.use(MdLinkAttributes, { attrs: { target: '_blank', rel: 'noopener' } }).use(MdKatex).use(MdMermaid)

const wrapClass = computed(() => {
  return [
    'text-wrap',
    'min-w-[20px]',
    'rounded-md',
    isMobile.value ? 'p-2' : 'px-3 py-2',
    props.inversion ? 'bg-[#d2f9d1]' : 'bg-[#f4f6f8]',
    props.inversion ? 'dark:bg-[#a1dc95]' : 'dark:bg-[#1e1e20]',
    props.inversion ? 'message-request' : 'message-reply',
    { 'text-red-500': props.error },
  ]
})

const text = computed(() => {
  const value = props.text ?? ''
  if (!props.asRawText) {
    // 对数学公式进行处理，自动添加 $$ 符号
    const escapedText = escapeBrackets(escapeDollarNumber(value))
    return mdi.render(escapedText)
  }
  return value
})

// 计算格式化后的sources，只在非加载状态下显示
const formattedSources = computed(() => {
  if (!props.sources || props.sources.length === 0 || props.loading) {
    return []
  }
  // 过滤出包含"出处"的条目
  return props.sources.filter(source => source.includes('出处'))
})

// 将sources中的文本转换为带链接的HTML
const processedSources = computed(() => {
  if (!props.sources || props.sources.length === 0 || props.loading) {
    return []
  }
  
  const filteredSources = props.sources.filter(source => source.includes('出处'))
  
  return filteredSources.map(source => {
    // 使用正则表达式查找链接并将其包装在<a>标签中
    const linkRegex = /(https?:\/\/[^\s\)]+)/g;
    return source.replace(linkRegex, '<a href="$1" target="_blank" rel="noopener" class="text-blue-500 hover:underline">$1</a>');
  })
})

function highlightBlock(str: string, lang?: string) {
  return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${t('chat.copyCode')}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`
}

function addCopyEvents() {
  if (textRef.value) {
    const copyBtn = textRef.value.querySelectorAll('.code-block-header__copy')
    copyBtn.forEach((btn) => {
      // 移除可能已存在的事件处理器
      removeCopyEventListener(btn as HTMLElement)
      
      // 创建新的事件处理函数
      const handler = () => {
        const code = btn.parentElement?.nextElementSibling?.textContent
        if (code) {
          copyToClip(code).then(() => {
            btn.textContent = t('chat.copied')
            setTimeout(() => {
              btn.textContent = t('chat.copyCode')
            }, 1000)
          })
        }
      }
      
      // 保存事件处理函数的引用
      copyEventHandlers.set(btn as HTMLElement, handler)
      
      // 添加事件监听器
      btn.addEventListener('click', handler)
    })
  }
}

function removeCopyEventListener(btn: HTMLElement) {
  const existingHandler = copyEventHandlers.get(btn)
  if (existingHandler) {
    btn.removeEventListener('click', existingHandler)
    copyEventHandlers.delete(btn)
  }
}

function removeCopyEvents() {
  if (textRef.value) {
    const copyBtn = textRef.value.querySelectorAll('.code-block-header__copy')
    copyBtn.forEach((btn) => {
      removeCopyEventListener(btn as HTMLElement)
    })
  }
}

function escapeDollarNumber(text: string) {
  let escapedText = ''

  for (let i = 0; i < text.length; i += 1) {
    let char = text[i]
    const nextChar = text[i + 1] || ' '

    if (char === '$' && nextChar >= '0' && nextChar <= '9')
      char = '\\$'

    escapedText += char
  }

  return escapedText
}

function escapeBrackets(text: string) {
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g
  return text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
    if (codeBlock)
      return codeBlock
    else if (squareBracket)
      return `$$${squareBracket}$$`
    else if (roundBracket)
      return `$${roundBracket}$`
    return match
  })
}

onMounted(() => {
  addCopyEvents()
})

onUpdated(() => {
  addCopyEvents()
})

onUnmounted(() => {
  removeCopyEvents()
})
</script>

<template>
  <div class="text-black" :class="wrapClass">
    <div ref="textRef" class="leading-relaxed break-words">
      <div v-if="!inversion">
        <div v-if="!asRawText" class="markdown-body" :class="{ 'markdown-body-generate': loading }" v-html="text" />
        <div v-else class="whitespace-pre-wrap" v-text="text" />
      </div>
      <div v-else class="whitespace-pre-wrap" v-text="text" />
      
      <!-- 显示sources信息，仅在非加载状态下显示 -->
      <div v-if="!inversion && processedSources.length > 0" class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
        <div class="font-semibold mb-1 text-gray-700 dark:text-gray-300">{{ $t('chat.sources') }}:</div>
        <div v-for="(source, index) in processedSources" :key="index" class="text-gray-600 dark:text-gray-400">
          <div class="source-content" v-html="source" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
@import url(./style.less);

// 为sources中的链接添加样式
.source-content a {
  color: #4f555e;
  text-decoration: underline;
  cursor: pointer;
  word-break: break-all;
  
  &:hover {
    color: #0960bd;
  }
  
  &:active {
    color: #0960bd;
  }
}

.dark .source-content a {
  color: #a0a0a0;
  
  &:hover {
    color: #2080f0;
  }
  
  &:active {
    color: #2080f0;
  }
}
</style>