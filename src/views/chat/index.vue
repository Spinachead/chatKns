<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NAutoComplete, NButton, NInput, useDialog, useMessage, NModal,NSelect,NInputNumber, NSlider, NSwitch } from 'naive-ui'
import { toPng } from 'html-to-image'
import { Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import { useUsingContext } from './hooks/useUsingContext'
import HeaderComponent from './components/Header/index.vue'
import { HoverButton, SvgIcon, AuthModal } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore, useChatStore, usePromptStore, useSettingStore } from '@/store'
import { fetchChatAPIProcess, fetchUploadFile, fetchListKnowledgeBases } from '@/api'
import { t } from '@/locales'

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const dialog = useDialog()
const ms = useMessage()

const authStore = useAuthStore()
const chatStore = useChatStore()
const settingStore = useSettingStore()
const { kb_name, top_k, score_threshold, return_direct } = storeToRefs(settingStore)

const { isMobile } = useBasicLayout()
const { addChat, updateChat, updateChatSome, getChatByUuidAndIndex } = useChat()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()
const { usingContext, toggleUsingContext } = useUsingContext()

const { uuid } = route.params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !!item.conversationOptions)))

const prompt = ref<string>('')
const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)
const showAuthModal = ref(false)
const showKnowledgeBaseModal = ref(false)

// 知识库相关状态
const kbName = ref(kb_name.value ?? '')
const topK = ref(top_k.value ?? 3)
const scoreThreshold = ref(score_threshold.value ?? 2.0)
const returnDirect = ref(return_direct.value ?? false)
const baseOptions = ref([])
const kbOptions = ref([])

// 添加PromptStore
const promptStore = usePromptStore()

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplate } = storeToRefs<any>(promptStore)

// 检查用户是否已登录
const isLoggedIn = computed(() => {
	return authStore.isAuth
})

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
	if (item.loading)
		updateChatSome(+uuid, index, { loading: false })
})

function handleSubmit() {
	if (!isLoggedIn.value) {
		showAuthModal.value = true
		return
	}
	onConversation()
}

function handleAuthClose() {
	// 可以在这里添加登录成功后的处理逻辑
	// 例如刷新页面或更新UI
}

async function onConversation() {
	let message = prompt.value

	if (loading.value)
		return

	if (!message || message.trim() === '')
		return

	controller = new AbortController()

	addChat(
		+uuid,
		{
			dateTime: new Date().toLocaleString(),
			text: message,
			inversion: true,
			error: false,
			conversationOptions: null,
			requestOptions: { prompt: message, options: null },
		},
	)
	scrollToBottom()

	loading.value = true
	prompt.value = ''

	let options: Chat.ConversationRequest = {}
	const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

	if (lastContext && usingContext.value)
		options = { ...lastContext }

	addChat(
		+uuid,
		{
			dateTime: new Date().toLocaleString(),
			text: t('chat.thinking'),
			loading: true,
			inversion: false,
			error: false,
			conversationOptions: null,
			requestOptions: { prompt: message, options: { ...options } },
		},
	)
	scrollToBottom()

	try {
		let lastText = ''
		const fetchChatAPIOnce = async () => {
			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				options,
				signal: controller.signal,
				onDownloadProgress: ({ event }) => {
					const xhr = event.target
					const { responseText } = xhr
					// 处理SSE格式的数据 (data: {...})
					const lines = responseText.split('\n')
					for (const line of lines) {
						if (line.startsWith('data:')) {
							const dataStr = line.substring(5).trim()
							const data = JSON.parse(dataStr)
							const content = data.choices[0]?.delta?.content ?? ''
							// 修复打字机效果，累积之前的内容而不是替换
							lastText = lastText + content
							updateChat(
								+uuid,
								dataSources.value.length - 1,
								{
									dateTime: new Date().toLocaleString(),
									text: lastText,
									inversion: false,
									error: false,
									loading: true,
									conversationOptions: { conversationId: data.id, parentMessageId: data.message_id },
									requestOptions: { prompt: message, options: { ...options } },
								},
							)

							if (openLongReply && data.choices[0]?.finish_reason === 'length') {
								options.parentMessageId = data.message_id
								// 保持lastText累积的内容
								message = ''
								return fetchChatAPIOnce()
							}
							scrollToBottomIfAtBottom()

						}
					}
				},
			})
			updateChatSome(+uuid, dataSources.value.length - 1, { loading: false })
		}

		await fetchChatAPIOnce()
	} catch (error: any) {
		const errorMessage = error?.message ?? t('common.wrong')

		if (error.message === 'canceled') {
			updateChatSome(
				+uuid,
				dataSources.value.length - 1,
				{
					loading: false,
				},
			)
			scrollToBottomIfAtBottom()
			return
		}

		const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

		if (currentChat?.text && currentChat.text !== '') {
			updateChatSome(
				+uuid,
				dataSources.value.length - 1,
				{
					text: `${currentChat.text}\n[${errorMessage}]`,
					error: false,
					loading: false,
				},
			)
			return
		}

		updateChat(
			+uuid,
			dataSources.value.length - 1,
			{
				dateTime: new Date().toLocaleString(),
				text: errorMessage,
				inversion: false,
				error: true,
				loading: false,
				conversationOptions: null,
				requestOptions: { prompt: message, options: { ...options } },
			},
		)
		scrollToBottomIfAtBottom()
	} finally {
		loading.value = false
	}
}

async function onRegenerate(index: number) {
	if (loading.value)
		return

	controller = new AbortController()

	const { requestOptions } = dataSources.value[index]

	let message = requestOptions?.prompt ?? ''

	let options: Chat.ConversationRequest = {}

	if (requestOptions.options)
		options = { ...requestOptions.options }

	loading.value = true

	updateChat(
		+uuid,
		index,
		{
			dateTime: new Date().toLocaleString(),
			text: '',
			inversion: false,
			error: false,
			loading: true,
			conversationOptions: null,
			requestOptions: { prompt: message, options: { ...options } },
		},
	)

	try {
		let lastText = ''
		const fetchChatAPIOnce = async () => {
			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				options,
				signal: controller.signal,
				onDownloadProgress: ({ event }) => {
					const xhr = event.target
					const { responseText } = xhr
					console.log("这是responseText", responseText)

					// 处理SSE格式的数据 (data: {...})
					const lines = responseText.split('\n')
					for (const line of lines) {
						if (line.startsWith('data:')) {
							try {
								const dataStr = line.substring(5).trim()
								const data = JSON.parse(dataStr)

								updateChat(
									+uuid,
									index,
									{
										dateTime: new Date().toLocaleString(),
										text: lastText + (data.choices[0]?.delta?.content ?? ''),
										inversion: false,
										error: false,
										loading: true,
										conversationOptions: { conversationId: data.conversationId, parentMessageId: data.message_id },
										requestOptions: { prompt: message, options: { ...options } },
									},
								)

								if (openLongReply && data.choices[0]?.finish_reason === 'length') {
									options.parentMessageId = data.message_id
									lastText = data.choices[0]?.delta?.content ?? ''
									message = ''
									return fetchChatAPIOnce()
								}

								scrollToBottomIfAtBottom()
							} catch (error) {
								//
							}
						}
					}
				},
			})
			updateChatSome(+uuid, index, { loading: false })
		}
		await fetchChatAPIOnce()
	} catch (error: any) {
		if (error.message === 'canceled') {
			updateChatSome(
				+uuid,
				index,
				{
					loading: false,
				},
			)
			return
		}

		const errorMessage = error?.message ?? t('common.wrong')

		updateChat(
			+uuid,
			index,
			{
				dateTime: new Date().toLocaleString(),
				text: errorMessage,
				inversion: false,
				error: true,
				loading: false,
				conversationOptions: null,
				requestOptions: { prompt: message, options: { ...options } },
			},
		)
	} finally {
		loading.value = false
	}
}

function handleExport() {
	if (loading.value)
		return

	const d = dialog.warning({
		title: t('chat.exportImage'),
		content: t('chat.exportImageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: async () => {
			try {
				d.loading = true
				const ele = document.getElementById('image-wrapper')
				const imgUrl = await toPng(ele as HTMLDivElement)
				const tempLink = document.createElement('a')
				tempLink.style.display = 'none'
				tempLink.href = imgUrl
				tempLink.setAttribute('download', 'chat-shot.png')
				if (typeof tempLink.download === 'undefined')
					tempLink.setAttribute('target', '_blank')
				document.body.appendChild(tempLink)
				tempLink.click()
				document.body.removeChild(tempLink)
				window.URL.revokeObjectURL(imgUrl)
				d.loading = false
				ms.success(t('chat.exportSuccess'))
				Promise.resolve()
			} catch (error: any) {
				ms.error(t('chat.exportFailed'))
			} finally {
				d.loading = false
			}
		},
	})
}

function handleDelete(index: number) {
	if (loading.value)
		return

	dialog.warning({
		title: t('chat.deleteMessage'),
		content: t('chat.deleteMessageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: () => {
			chatStore.deleteChatByUuid(+uuid, index)
		},
	})
}

function handleClear() {
	if (loading.value)
		return

	dialog.warning({
		title: t('chat.clearChat'),
		content: t('chat.clearChatConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: () => {
			chatStore.clearChatByUuid(+uuid)
		},
	})
}

function handleEnter(event: KeyboardEvent) {
	if (!isMobile.value) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			handleSubmit()
		}
	} else {
		if (event.key === 'Enter' && event.ctrlKey) {
			event.preventDefault()
			handleSubmit()
		}
	}
}

function handleStop() {
	if (loading.value) {
		controller.abort()
		loading.value = false
	}
}

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
	if (prompt.value.startsWith('/')) {
		return promptTemplate.value.filter((item: {
			key: string
		}) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
			return {
				label: obj.value,
				value: obj.value,
			}
		})
	} else {
		return []
	}
})

// value反渲染key
const renderOption = (option: { label: string }) => {
	for (const i of promptTemplate.value) {
		if (i.value === option.label)
			return [i.key]
	}
	return []
}

const placeholder = computed(() => {
	if (isMobile.value)
		return t('chat.placeholderMobile')
	return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
	return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
	let classes = ['p-4']
	if (isMobile.value)
		classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
	return classes
})

// 获取知识库列表
async function fetchKnowledgeBase() {
	try {
		const res = await fetchListKnowledgeBases()
		baseOptions.value = res.data
		kbOptions.value = res.data.map((item: any) => ({
			label: item.kb_name,
			value: item.kb_name
		}))
	} catch (error) {
		ms.error(t('common.knowledgeBaseFetchError'))
	}
}

onMounted(() => {
	scrollToBottom()
	fetchKnowledgeBase()
	if (inputRef.value && !isMobile.value)
		inputRef.value?.focus()
})

onUnmounted(() => {
	if (loading.value)
		controller.abort()
})

function saveKnowledgeBaseSettings() {
	// 更新设置store
	const settingStore = useSettingStore()
	settingStore.setKbName(kbName.value)
	settingStore.setTopk(topK.value)
	settingStore.setScoreThreshold(scoreThreshold.value)
	settingStore.setReturnDirect(returnDirect.value)

	// 关闭弹窗
	showKnowledgeBaseModal.value = false

	// 显示成功消息
	ms.success(t('common.success'))
}
</script>

<template>
	<div class="flex flex-col w-full h-full">
		<HeaderComponent v-if="isMobile" :using-context="usingContext" @export="handleExport"
			@handle-clear="handleClear" />
		<main class="flex-1 overflow-hidden">
			<div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
				<div class="w-full max-w-screen-xl m-auto dark:bg-[#101014]" :class="[isMobile ? 'p-2' : 'p-4']">
					<div id="image-wrapper" class="relative">
						<template v-if="!dataSources.length">
							<div class="flex items-center justify-center mt-4 text-center text-neutral-300">
								<SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
								<span v-if="isLoggedIn">{{ t('chat.newChatTitle') }}</span>
								<div v-else class="flex flex-col items-center">
									<span>{{ t('chat.newChatTitle') }}</span>
									<NButton text type="primary" @click="showAuthModal = true" class="mt-2">
										{{ $t('auth.clickToLogin') }}
									</NButton>
								</div>
							</div>
						</template>
						<template v-else>
							<div>
								<Message v-for="(item, index) of dataSources" :key="index" :date-time="item.dateTime"
									:text="item.text" :inversion="item.inversion" :error="item.error"
									:loading="item.loading" @regenerate="onRegenerate(index)"
									@delete="handleDelete(index)" />
								<!-- 未登录状态下始终显示登录按钮 -->
								<div v-if="!isLoggedIn" class="flex justify-center mt-4">
									<NButton text type="primary" @click="showAuthModal = true">
										{{ $t('auth.clickToLogin') }}
									</NButton>
								</div>
								<div class="sticky bottom-0 left-0 flex justify-center">
									<NButton v-if="loading" type="warning" @click="handleStop">
										<template #icon>
											<SvgIcon icon="ri:stop-circle-line" />
										</template>
										{{ t('common.stopResponding') }}
									</NButton>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</main>
		<footer :class="footerClass">
			<div class="w-full max-w-screen-xl m-auto">
				<div class="flex items-center justify-between space-x-2">
					<HoverButton v-if="!isMobile" @click="handleClear">
						<span class="text-xl text-[#4f555e] dark:text-white">
							<SvgIcon icon="ri:delete-bin-line" />
						</span>
					</HoverButton>
					<HoverButton v-if="!isMobile" @click="handleExport">
						<span class="text-xl text-[#4f555e] dark:text-white">
							<SvgIcon icon="ri:download-2-line" />
						</span>
					</HoverButton>
					<HoverButton v-if="!isMobile" @click="showKnowledgeBaseModal = true">
						<span class="text-xl text-[#4f555e] dark:text-white">
							<SvgIcon icon="ri:book-3-line" />
						</span>
					</HoverButton>
					<HoverButton @click="toggleUsingContext">
						<span class="text-xl"
							:class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
							<SvgIcon icon="ri:chat-history-line" />
						</span>
					</HoverButton>
					<NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
						<template #default="{ handleInput, handleBlur, handleFocus }">
							<NInput ref="inputRef" v-model:value="prompt" type="textarea" :placeholder="placeholder"
								:autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }" @input="handleInput"
								@focus="handleFocus" @blur="handleBlur" @keypress="handleEnter" />
						</template>
					</NAutoComplete>
					<NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
						<template #icon>
							<span class="dark:text-black">
								<SvgIcon icon="ri:send-plane-fill" />
							</span>
						</template>
					</NButton>
				</div>
			</div>
		</footer>
		<AuthModal v-model:visible="showAuthModal" @close="handleAuthClose" />

		<!-- 知识库配置弹窗 -->
		<NModal v-model:show="showKnowledgeBaseModal" :title="$t('setting.rag')" preset="card" style="width: 600px;"
			:bordered="false">
			<div class="p-4 space-y-5 min-h-[200px]">
				<div class="space-y-6">
					<div class="flex items-center space-x-4">
						<span class="flex-shrink-0 w-[120px]">{{ $t('setting.knowledgeBaseName') }}</span>
						<div class="flex flex-wrap items-center gap-4">
							<NSelect style="width: 140px" v-model:value="kbName" :options="kbOptions"
								placeholder="Select Knowledge Base" />
						</div>
					</div>

					<div class="flex items-center space-x-4">
						<span class="flex-shrink-0 w-[120px]">{{ $t('setting.topK') }}</span>
						<div class="flex-1">
							<NInputNumber v-model:value="topK" :min="0" :max="10" style="width: 140px;"></NInputNumber>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<span class="flex-shrink-0 w-[120px]">{{ $t('setting.scoreThreshold') }}</span>
						<div class="flex-1">
							<NSlider v-model:value="scoreThreshold" :max="2.0" :min="0.0" :step="0.1"></NSlider>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<span class="flex-shrink-0 w-[120px]">{{ $t('setting.returnDirect') }}</span>
						<div class="flex-1">
							<NSwitch v-model:value="returnDirect"></NSwitch>
						</div>
					</div>
				</div>

				<div class="flex justify-end">
					<NButton type="primary" @click="saveKnowledgeBaseSettings">
						{{ $t('common.save') }}
					</NButton>
				</div>
			</div>
		</NModal>
	</div>
</template>
