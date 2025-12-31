import axios, { type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store'
import {fetchRefreshToken} from "@/api";

const service = axios.create({
  baseURL: import.meta.env.VITE_GLOB_API_URL,
})

service.interceptors.request.use(
  (config) => {
    const token = useAuthStore().accessToken
    if (token)
      config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    return Promise.reject(error.response)
  },
)

// 在前端实现自动刷新
service.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    if (response.status === 200)
      return response

    throw new Error(response.status.toString())
  },
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // 尝试使用刷新令牌获取新访问令牌

				const refreshResponse = await fetchRefreshToken({refresh_token: useAuthStore().refreshToken})

        if (refreshResponse.code === 200) {
					const {access_token} = refreshResponse.data;
					useAuthStore().setAccessToken(access_token);
          // 更新 axios 默认头部
          service.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          // 重新发送原始请求
          const originalRequest = error.config;
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          return service(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // 刷新失败，跳转到登录页
				useAuthStore().removeAccessToken()
      }
    }
    return Promise.reject(error)
  },
)

export default service
