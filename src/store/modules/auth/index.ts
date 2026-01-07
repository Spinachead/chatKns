import {defineStore} from 'pinia'
import {
 	removeAccessToken,
	removeRefreshToken,
	setAccessToken,
	setRefreshToken,
	getAccessToken,
	getRefreshToken,
} from './helper'
import {store} from '@/store/helper'
import {fetchUserInfo } from "@/api";

export interface AuthState {
	isAuth: boolean
	accessToken: string | null
	refreshToken: string | null
}

export const useAuthStore = defineStore('auth-store', {
	state: (): AuthState => ({
		isAuth: false,
		accessToken: getAccessToken() || '',
		refreshToken: getRefreshToken() || '',
	}),

	getters: {
		token(): string | null {
			return this.accessToken
		}
	},

	actions: {
		setAccessToken(accessToken: string) {
			this.accessToken = accessToken
			setAccessToken(accessToken)
			if (accessToken) {
				this.isAuth = true
			}
		},

		removeAccessToken() {
			this.accessToken = ''
			removeAccessToken()
			this.isAuth = false
		},
		setRefreshToken( refreshToken: string) {
			this.refreshToken = refreshToken
			setRefreshToken(refreshToken)
		},
		removeRefreshToken() {
			this.refreshToken = ''
			 removeRefreshToken()
		},

		setToken(token: string) {
			this.setAccessToken(token)
		},
		
		removeToken() {
			this.removeAccessToken()
		},

		async initializeAuth() {
			const token = getAccessToken()
			if (token) {
				try {
					// 验证令牌有效性
					const response = await fetchUserInfo()
					if (response.code === 200) {
						this.accessToken = token
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
