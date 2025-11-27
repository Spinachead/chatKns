import { MockMethod } from './types'

const mockMethods: MockMethod[] = [
  {
    url: '/api/chat',
    method: 'post',
    response: () => {
      return {
        status: 'Success',
        data: {
          id: 'chat-1',
          role: 'assistant',
          text: '这是来自模拟API的响应数据！',
          dateTime: new Date().toLocaleString(),
        },
        message: null,
      }
    },
  },
  {
    url: '/api/chat-process',
    method: 'post',
    response: () => {
      return {
        status: 'Success',
        data: '这是来自模拟API的流式响应数据！\n支持多行文本展示。\n项目已经成功运行起来了！',
        message: null,
      }
    },
  },
  {
    url: '/api/config',
    method: 'post',
    response: () => {
      return {
        status: 'Success',
        data: {
          apiModel: 'Mock-API',
          socksProxy: false,
          httpsProxy: false,
        },
        message: null,
      }
    },
  },
  {
    url: '/api/session',
    method: 'post',
    response: () => {
      return {
        status: 'Success',
        data: {
          auth: true,
          model: 'Mock-API',
        },
        message: null,
      }
    },
  },
  {
    url: '/api/verify',
    method: 'post',
    response: (options: any) => {
      const { token } = options.body
			if (!token)
				return { status: 'Fail', message: 'Secret key is empty', data: null }

			// 在 mock 环境中，我们假设任何非空的 token 都是有效的
			// 但在生产环境中，这里应该有一个真实的 token 验证过程
			if (token === 'test_token') {
				return {
					status: 'Success',
					message: 'Verify successfully',
					data: null,
				}
			}

			// 对于其他情况，我们可以认为验证成功，以便测试正常使用流程
			return {
				status: 'Success',
				message: 'Verify successfully',
				data: null,
			}
		}
	},
]

export default mockMethods
