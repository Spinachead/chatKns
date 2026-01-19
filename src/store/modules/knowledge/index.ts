import { defineStore } from 'pinia'
import { fetchListKnowledgeBases, fetchListFiles } from '@/api'

export interface KnowledgeBase {
  id: number
  kb_name: string
  kb_info?: string
  vector_store_type?: string
  embedding_model?: string
}

export interface KnowledgeState {
  currentKnowledgeBase: string | null
  knowledgeBases: KnowledgeBase[]
  knowledgeBaseFiles: any[]
  loading: boolean
}

export const useKnowledgeStore = defineStore('knowledge-store', {
  state: (): KnowledgeState => ({
    currentKnowledgeBase: 'samples',
    knowledgeBases: [],
    knowledgeBaseFiles: [],
    loading: false
  }),

  actions: {
    // 获取知识库列表
    async fetchKnowledgeBases() {
      this.loading = true
      try {
        const res = await fetchListKnowledgeBases()
        this.knowledgeBases = res.data
        return res.data
      } catch (error) {
        console.error('获取知识库列表失败:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    // 获取知识库文件列表
    async fetchKnowledgeBaseFiles(knowledgeBaseName: string) {
      this.loading = true
      try {
        const res = await fetchListFiles({ knowledge_base_name: knowledgeBaseName })
        this.knowledgeBaseFiles = res.data
        return res.data
      } catch (error) {
        console.error('获取知识库文件列表失败:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    // 设置当前选中的知识库
    async setCurrentKnowledgeBase(knowledgeBaseName: string) {
      this.currentKnowledgeBase = knowledgeBaseName
      await this.fetchKnowledgeBaseFiles(knowledgeBaseName)
    },

    // 刷新当前知识库的文件列表
    async refreshCurrentKnowledgeBaseFiles() {
      if (this.currentKnowledgeBase) {
        await this.fetchKnowledgeBaseFiles(this.currentKnowledgeBase)
      }
    },

    // 刷新知识库列表
    async refreshKnowledgeBases() {
      await this.fetchKnowledgeBases()
    }
  }
})
