export interface MockMethod {
  url: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  response: (...args: any[]) => any
}