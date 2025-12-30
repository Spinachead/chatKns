import { ss } from '@/utils/storage'

const ACCESS_TOKEN = 'access_token'
const REFRESH_TOKEN = "refresh_token"

export function getToken() {
  return ss.get(ACCESS_TOKEN)
}

export function setToken(token: string) {
  return ss.set(ACCESS_TOKEN, token)
}

export function removeToken() {
  return ss.remove(ACCESS_TOKEN)
}

export function getRefreshToken() {
	return ss.get(REFRESH_TOKEN)
}

export function setRefreshToken(token: string) {
	return ss.set(REFRESH_TOKEN, token)
}

export function removeRefreshToken() {
	return ss.remove(REFRESH_TOKEN)
}
