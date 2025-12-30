import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import {get, post} from '@/utils/request'
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
    kb_name: settingStore.kb_name
  }
	console.log("这是请求data", data)

  if (authStore.isChatGPTAPI) {
    data = {
      ...data,
      systemMessage: settingStore.systemMessage,
      temperature: settingStore.temperature,
      top_p: settingStore.top_p,
    }
  }

  return post<T>({
    url: '/kb_chat',
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
		chunk_size: number,
		chunk_overlap: number,
		zh_title_enhance: boolean
	}
) {
	const formData = new FormData();

	// 处理不同类型的 files 参数
	if (params.files instanceof File) {
		formData.append('files', params.files);
	} else if (params.files instanceof FileList) {
		for (let i = 0; i < params.files.length; i++) {
			if (params.files[i]) {
				formData.append('files', params.files[i] as File);
			}
		}
	} else if (Array.isArray(params.files)) {
		params.files.forEach(file => {
			if (file) {
				formData.append('files', file);
			}
		});
	}

	formData.append('knowledge_base_name', params.knowledge_base_name);
	formData.append('chunk_size', params.chunk_size.toString());
	formData.append('chunk_overlap', params.chunk_overlap.toString());
	formData.append('zh_title_enhance', params.zh_title_enhance.toString());

	console.log("这是formdata中的files", formData.getAll('files'));

	return post<T>({
		url: '/upload_docs',
		data: formData,
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	})
}


export function fetchListKnowledgeBases<T = any>() {
	return get<T>({
		url: 'list_knowledge_bases',
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
		url: 'create_knowledge_base',
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
	console.log("这是删除的参数", data)

	return post<T>({
		url: 'delete_knowledge_base',
		data: data
	})
}

export function fetchListFiles<T = any>(
	params:{
		knowledge_base_name: string
	}
) {
	let data: Record<string, any> = {
		knowledge_base_name: params.knowledge_base_name
	}
	return get<T>({
		url: 'list_files',
		data: data  // 这些数据会作为查询参数附加到 URL 上
	})
}

export function fetchDeleteDocs<T = any>(
	params:{
		knowledge_base_name: string,
		file_names: string [],
		delete_content: boolean,
		not_refresh_vs_cache: boolean
	}
) {
	let data: Record<string, any> = {
		knowledge_base_name: params.knowledge_base_name,
		file_names: params.file_names,
		delete_content: params.delete_content,
		not_refresh_vs_cache: params.not_refresh_vs_cache
	}
	return post<T>({
		url: 'delete_docs',
		data: data
	})
}

export function getCaptcha<T = any>() {
	return get<T>({
		url: 'get_captcha',
	})
}

export function verifyCaptcha<T =any>(
	params: {
		captcha_key: String,
		captcha_code: string
	}
) {
	let data: Record<string, any> = {
		captcha_key: params.captcha_key,
		captcha_code: params.captcha_code
	}
	return post<T>({
		url: 'verify_captcha',
		data: data
	})
}

export function sendEmailVerification<T = any>(
	params: {
		email: string
	}
) {
	let data: Record<string, any> = {
		email: params.email
	}
	return post<T>({
		url: 'send_email_verification',
		data: data
	})
}

export function register<T = any>(
	params: {
		email: string,
		password: string,
		confirm_password: string,
		email_verification_code: string
	}
) {
	let data: Record<string, any> = {
		email: params.email,
		password: params.password,
		confirm_password: params.confirm_password,
		email_verification_code: params.email_verification_code
	}
	return post<T>({
		url: 'register',
		data: data
	})
}

export function login<T = any>(
	params: {
		email: string,
		password: string
	}
) {
	let data: Record<string, any> = {
		email: params.email,
		password: params.password
	}
	return post<T>({
		url: 'login',
		data: data
	})
}


