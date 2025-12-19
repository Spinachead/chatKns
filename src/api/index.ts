import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import { post } from '@/utils/request'
import { useAuthStore, useSettingStore } from '@/store'

export function fetchChatAPI<T = any>(
  prompt: string,
  options?: { conversationId?: string; parentMessageId?: string },
  signal?: GenericAbortSignal,
) {
  return post<T>({
    url: '/chat',
    data: { prompt, options },
    signal,
  })
}

export function fetchChatConfig<T = any>() {
  return post<T>({
    url: '/config',
  })
}

export function fetchChatAPIProcess<T = any>(
  params: {
    prompt: string
    options?: { conversationId?: string; parentMessageId?: string }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void },
) {
  const settingStore = useSettingStore()
  const authStore = useAuthStore()

  let data: Record<string, any> = {
    prompt: params.prompt,
    options: params.options,
    query: params.prompt,
    kb_name: 'samples',
  }

  if (authStore.isChatGPTAPI) {
    data = {
      ...data,
      systemMessage: settingStore.systemMessage,
      temperature: settingStore.temperature,
      top_p: settingStore.top_p,
    }
  }

  return post<T>({
    url: '/kb_chat2',
    data,
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

export function fetchSession<T>() {
  return post<T>({
    url: '/session',
  })
}

export function fetchVerify<T>(token: string) {
  return post<T>({
    url: '/verify',
    data: { token },
  })
}

export function fetchUploadFile<T = any>(
  params: {
    files: File | FileList | (File | null)[]
    knowledge_base_name: string
  }
) {
	let data: Record<any, any> = {
		files: params.files,
		knowledge_base_name: params.knowledge_base_name,
  }

  return post<T>({
    url: '/upload_docs',
    data: data,
  })
}

export function fetchListKnowledgeBases<T = any>() {
	return post<T>({
		url: 'api/list_knowledge_bases',
	})
}

export function createKnowledgeBase<T = any>(
	params: {
		knowledge_base_name: string,
		vector_store_type: string,
		kb_info: string,
		embed_model: string
	}
){
	let data: Record<string, any> = {
		knowledge_base_name: params.knowledge_base_name,
		vector_store_type: params.vector_store_type,
		kb_info: params.kb_info,
		embed_model: params.embed_model
	}

	return post<T>({
		url: 'api/create_knowledge_base',
		data: data
	})
}

export function deleteKnowledgeBase<T = any>(
	params: {
		knowledge_base_name: string
	}
){
	let data: Record<string, any> = {
		knowledge_base_name: params.knowledge_base_name
	}

	return post<T>({
		url: 'api/delete_knowledge_base',
		data: data
	})
}
