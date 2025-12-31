import {defineStore} from 'pinia'
import {
 	removeAccessToken,
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
	accessToken: string | null
	refreshToken: string | null

}

export const useAuthStore = defineStore('auth-store', {
	state: (): AuthState => ({
		isAuth: false,
		accessToken: '',
		refreshToken: '',
	}),

	getters: {

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
			this.accessToken = accessToken
			setAccessToken(accessToken)
		},

		removeAccessToken() {
			this.accessToken = ''
			removeAccessToken()
		},
		setRefreshToken( refreshToken: string) {
			this.refreshToken = refreshToken
			setRefreshToken(refreshToken)
		},
		removeRefreshToken() {
			this.refreshToken = ''
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
