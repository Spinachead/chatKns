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
  const formData = new FormData()
  formData.append('knowledge_base_name', params.knowledge_base_name)

  // Handle different file input types
  if (params.files instanceof FileList) {
    for (let i = 0; i < params.files.length; i++) {
      formData.append('files', params.files[i])
    }
		console.log(1);
  } else if (params.files instanceof File) {
    formData.append('files', params.files)
		console.log(2);
  } else if (Array.isArray(params.files)) {
    params.files.forEach(file => {
      if (file) {
        formData.append('files', file)
      }
    })
		console.log(3);
  }else {
		console.log(4);
		console.log(params.files);
	}

  return post<T>({
    url: '/upload_docs',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
