import {defineStore} from 'pinia'
import {
	getAccessToken,
	getRefreshToken, removeAccessToken,
	removeRefreshToken,
	setAccessToken,
	setRefreshToken,
} from './helper'
import {store} from '@/store/helper'
import {fetchUserInfo} from "@/api";
// import {fetchSession} from '@/api'
//
// interface SessionResponse {
// 	auth: boolean
// 	model: 'ChatGPTAPI' | 'ChatGPTUnofficialProxyAPI'
// }

export interface AuthState {
	isAuth: boolean
}

export const useAuthStore = defineStore('auth-store', {
	state: (): AuthState => ({
		isAuth: false,
	}),

	getters: {
		accessToken() {
			return getAccessToken()
		},
		refreshToken() {
			return getRefreshToken()
		},

	},

	actions: {
		// async getSession() {
		// 	try {
		// 		const {data} = await fetchSession<SessionResponse>()
		// 		this.session = {...data}
		// 		return Promise.resolve(data)
		// 	} catch (error) {
		// 		return Promise.reject(error)
		// 	}
		// },

		setAccessToken(accessToken: string) {
			setAccessToken(accessToken)
		},

		removeAccessToken() {
			removeAccessToken()
		},
		setRefreshToken( refreshToken: string) {
			setRefreshToken(refreshToken)
		},
		removeRefreshToken() {
			 removeRefreshToken()
		},

		async initializeAuth() {
			if (this.accessToken) {
				try {
					// 验证令牌有效性
					const response = await fetchUserInfo()
					if (response.code === 200) {
						this.isAuth = true
					} else {
						// 令牌无效，清除它们
						this.removeAccessToken()
						this.removeRefreshToken()
					}
				} catch (error) {
					this.removeAccessToken()
					this.removeRefreshToken()
				}

			}
		}
	},
})

export function useAuthStoreWithout() {
	return useAuthStore(store)
}
