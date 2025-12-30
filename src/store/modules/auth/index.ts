import {defineStore} from 'pinia'
import {getRefreshToken, getToken, removeRefreshToken, removeToken, setRefreshToken, setToken} from './helper'
import {store} from '@/store/helper'
import {fetchSession} from '@/api'

interface SessionResponse {
	auth: boolean
	model: 'ChatGPTAPI' | 'ChatGPTUnofficialProxyAPI'
}

export interface AuthState {
	token: string | undefined
	session: SessionResponse | null
	isAuth: boolean
}

export const useAuthStore = defineStore('auth-store', {
	state: (): AuthState => ({
		token: getToken(),
		session: null,
		isAuth: false,
	}),

	getters: {
		isChatGPTAPI(state): boolean {
			return state.session?.model === 'ChatGPTAPI'
		},
		accessToken() {
			return getToken()
		},
		refreshToken() {
			return getRefreshToken()
		},
		hasTokens() {
			return !!(this.refreshToken() && this.accessToken())
		}

	},

	actions: {
		async getSession() {
			try {
				const {data} = await fetchSession<SessionResponse>()
				this.session = {...data}
				return Promise.resolve(data)
			} catch (error) {
				return Promise.reject(error)
			}
		},

		setToken(accessToken: string, refreshToken: string) {
			this.token = accessToken
			setToken(accessToken)
			setRefreshToken(refreshToken)
		},

		removeToken() {
			this.token = undefined
			removeToken()
			removeRefreshToken()
		},

		async initializeAuth() {
			if (this.hasTokens) {
				try {
					// 验证令牌有效性
					const response = await fetch('/api/user_info', {
						headers: {
							'Authorization': `Bearer ${this.accessToken}`
						}
					})

					if (response.ok) {
						this.isAuth = true
					} else {
						// 令牌无效，清除它们
						this.removeToken()
					}
				} catch (error) {
					this.removeToken()
				}

			}
		}
	},
})

export function useAuthStoreWithout() {
	return useAuthStore(store)
}
