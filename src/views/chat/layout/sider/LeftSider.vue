<template>
  <div v-if="!isMobile" class="left-sider">
    <div class="icons-container">
      <div 
        class="icon-item" 
        :class="{ 'active': isActiveRoute('Chat') }"
        @click="goToChat"
        title="Chat"
      >
        <svg 
          class="icon-svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M7.5 5.25C7.5 4.46625 7.81052 3.92093 8.22579 3.52991C8.64106 3.13889 9.19875 2.875 10 2.875C10.8012 2.875 11.3589 3.13889 11.7742 3.52991C12.1895 3.92093 12.5 4.46625 12.5 5.25V7.75H15.5C17.0957 7.75 18.4375 9.09175 18.4375 10.6875V14.3125C18.4375 15.9083 17.0957 17.25 15.5 17.25H14.5V19.5C14.5 19.81 14.29 20 13.98 20C13.6962 20 13.5 19.81 13.5 19.5V17.25H10C8.40425 17.25 7.0625 15.9083 7.0625 14.3125V5.25Z" 
            fill="currentColor"
          />
          <path 
            d="M6 18.25C6 19.0338 5.68947 19.5791 5.27421 19.9701C4.85894 20.3611 4.30125 20.625 3.5 20.625C2.69875 20.625 2.14106 20.3611 1.72579 19.9701C1.31052 19.5791 1 19.0338 1 18.25C1 17.4662 1.31052 16.9209 1.72579 16.5299C2.14106 16.1389 2.69875 15.875 3.5 15.875C4.30125 15.875 4.85894 16.1389 5.27421 16.5299C5.68947 16.9209 6 17.4662 6 18.25Z" 
            fill="currentColor"
          />
          <path 
            d="M23 18.25C23 19.0338 22.6895 19.5791 22.2742 19.9701C21.8589 20.3611 21.3012 20.625 20.5 20.625C19.6988 20.625 19.1411 20.3611 18.7258 19.9701C18.3105 19.5791 18 19.0338 18 18.25C18 17.4662 18.3105 16.9209 18.7258 16.5299C19.1411 16.1389 19.6988 15.875 20.5 15.875C21.3012 15.875 21.8589 16.1389 22.2742 16.5299C22.6895 16.9209 23 17.4662 23 18.25Z" 
            fill="currentColor"
          />
        </svg>
      </div>
      
      <div 
        class="icon-item" 
        :class="{ 'active': isActiveRoute('Knowledge') }"
        @click="goToKnowledge"
        title="Knowledge"
      >
        <svg 
          class="icon-svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 3C7.28595 3 4 6.41015 4 10.7294C4 14.5019 6.94308 17.922 11.1747 18.6063C11.699 18.7008 12 19.1696 12 19.7157V21.75C12 22.1642 12.3358 22.5 12.75 22.5C13.1642 22.5 13.5 22.1642 13.5 21.75V19.7157C13.5 19.1696 13.801 18.7008 14.3253 18.6063C18.5569 17.922 21.5 14.5019 21.5 10.7294C21.5 6.41015 18.714 3 14 3C13.2206 3 12.4691 3.14187 11.767 3.40756C11.0437 3.13985 10.2648 3 9.5 3H12Z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  </div>
  
  <div v-else class="mobile-nav">
    <div 
      class="mobile-nav-item" 
      :class="{ 'active': isActiveRoute('Chat') }"
      @click="goToChat"
    >
      <svg 
        class="mobile-icon-svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M7.5 5.25C7.5 4.46625 7.81052 3.92093 8.22579 3.52991C8.64106 3.13889 9.19875 2.875 10 2.875C10.8012 2.875 11.3589 3.13889 11.7742 3.52991C12.1895 3.92093 12.5 4.46625 12.5 5.25V7.75H15.5C17.0957 7.75 18.4375 9.09175 18.4375 10.6875V14.3125C18.4375 15.9083 17.0957 17.25 15.5 17.25H14.5V19.5C14.5 19.81 14.29 20 13.98 20C13.6962 20 13.5 19.81 13.5 19.5V17.25H10C8.40425 17.25 7.0625 15.9083 7.0625 14.3125V5.25Z" 
          fill="currentColor"
        />
        <path 
          d="M6 18.25C6 19.0338 5.68947 19.5791 5.27421 19.9701C4.85894 20.3611 4.30125 20.625 3.5 20.625C2.69875 20.625 2.14106 20.3611 1.72579 19.9701C1.31052 19.5791 1 19.0338 1 18.25C1 17.4662 1.31052 16.9209 1.72579 16.5299C2.14106 16.1389 2.69875 15.875 3.5 15.875C4.30125 15.875 4.85894 16.1389 5.27421 16.5299C5.68947 16.9209 6 17.4662 6 18.25Z" 
          fill="currentColor"
        />
        <path 
          d="M23 18.25C23 19.0338 22.6895 19.5791 22.2742 19.9701C21.8589 20.3611 21.3012 20.625 20.5 20.625C19.6988 20.625 19.1411 20.3611 18.7258 19.9701C18.3105 19.5791 18 19.0338 18 18.25C18 17.4662 18.3105 16.9209 18.7258 16.5299C19.1411 16.1389 19.6988 15.875 20.5 15.875C21.3012 15.875 21.8589 16.1389 22.2742 16.5299C22.6895 16.9209 23 17.4662 23 18.25Z" 
          fill="currentColor"
        />
      </svg>
    </div>
    
    <div 
      class="mobile-nav-item" 
      :class="{ 'active': isActiveRoute('Knowledge') }"
      @click="goToKnowledge"
    >
      <svg 
        class="mobile-icon-svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 3C7.28595 3 4 6.41015 4 10.7294C4 14.5019 6.94308 17.922 11.1747 18.6063C11.699 18.7008 12 19.1696 12 19.7157V21.75C12 22.1642 12.3358 22.5 12.75 22.5C13.1642 22.5 13.5 22.1642 13.5 21.75V19.7157C13.5 19.1696 13.801 18.7008 14.3253 18.6063C18.5569 17.922 21.5 14.5019 21.5 10.7294C21.5 6.41015 18.714 3 14 3C13.2206 3 12.4691 3.14187 11.767 3.40756C11.0437 3.13985 10.2648 3 9.5 3H12Z" 
          fill="currentColor"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useBasicLayout } from '@/hooks/useBasicLayout'

const route = useRoute()
const router = useRouter()
const { isMobile } = useBasicLayout()

function isActiveRoute(routeName: string) {
  return route.name === routeName
}

function goToChat() {
  router.push({ name: 'Chat' })
}

function goToKnowledge() {
  router.push({ name: 'Knowledge' })
}
</script>

<style scoped>
.left-sider {
  width: 60px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  border-right: 1px solid #eee;
  background-color: #fff;
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  box-shadow: 2px 0 4px rgba(0,0,0,0.05);
}

.icons-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  align-items: center;
}

.icon-item {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.icon-item:hover {
  background-color: #f0f0f0;
  color: #4b9e5f;
}

.icon-item.active {
  background-color: #e7f5ee;
  color: #4b9e5f;
}

.icon-svg {
  width: 24px;
  height: 24px;
}

.mobile-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 60px;
  background-color: #fff;
  border-top: 1px solid #eee;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 10px;
}

.mobile-nav-item {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.mobile-nav-item:hover,
.mobile-nav-item.active {
  background-color: #e7f5ee;
  color: #4b9e5f;
}

.mobile-icon-svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .mobile-nav {
    padding: 0 50px;
  }
}
</style>