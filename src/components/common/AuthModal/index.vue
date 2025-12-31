<template>
  <NModal :show="visible" :on-after-leave="onClose" preset="card" style="width: 90%; max-width: 500px;">
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <NTabs v-model:value="authType" type="segment" animated>
          <NTab name="login">{{ $t('auth.login') }}</NTab>
          <NTab name="register">{{ $t('auth.register') }}</NTab>
        </NTabs>
      </div>

      <!-- 登录表单 -->
      <div v-if="authType === 'login'" class="space-y-4">
        <NFormItem :label="$t('auth.email')" :show-feedback="false">
          <NInput
            v-model:value="loginForm.email"
            :placeholder="$t('auth.emailPlaceholder')"
            autocomplete="email"
          >
            <template #prefix>
              <SvgIcon icon="ic:outline-email" class="text-lg" />
            </template>
          </NInput>
        </NFormItem>

        <NFormItem :label="$t('auth.password')" :show-feedback="false">
          <NInput
            v-model:value="loginForm.password"
            type="password"
            :placeholder="$t('auth.passwordPlaceholder')"
            autocomplete="current-password"
          >
            <template #prefix>
              <SvgIcon icon="ic:outline-lock" class="text-lg" />
            </template>
          </NInput>
        </NFormItem>

        <NButton
          type="primary"
          :loading="loading"
          :disabled="!loginForm.email || !loginForm.password"
          block
          @click="handleLogin"
          class="mt-4"
        >
          {{ $t('auth.login') }}
        </NButton>
      </div>

      <!-- 注册表单 -->
      <div v-if="authType === 'register'" class="space-y-4">
        <NFormItem :label="$t('auth.email')" :show-feedback="false">
          <NInput
            v-model:value="registerForm.email"
            :placeholder="$t('auth.emailPlaceholder')"
            autocomplete="email"
          >
            <template #prefix>
              <SvgIcon icon="ic:outline-email" class="text-lg" />
            </template>
          </NInput>
        </NFormItem>

        <NFormItem :label="$t('auth.password')" :show-feedback="false">
          <NInput
            v-model:value="registerForm.password"
            type="password"
            :placeholder="$t('auth.passwordPlaceholder')"
            autocomplete="new-password"
          >
            <template #prefix>
              <SvgIcon icon="ic:outline-lock" class="text-lg" />
            </template>
          </NInput>
        </NFormItem>

        <NFormItem :label="$t('auth.confirmPassword')" :show-feedback="false">
          <NInput
            v-model:value="registerForm.confirmPassword"
            type="password"
            :placeholder="$t('auth.confirmPasswordPlaceholder')"
            autocomplete="new-password"
          >
            <template #prefix>
              <SvgIcon icon="ic:outline-lock" class="text-lg" />
            </template>
          </NInput>
        </NFormItem>

        <!-- 图形验证码 -->
        <NFormItem :label="$t('auth.captcha')" :show-feedback="false">
          <div class="flex gap-2">
            <NInput
              v-model:value="registerForm.captcha_code"
              :placeholder="$t('auth.captchaPlaceholder')"
              class="flex-1"
            >
              <template #prefix>
                <SvgIcon icon="ic:outline-verified-user" class="text-lg" />
              </template>
            </NInput>
            <NButton
              @click="loadCaptcha"
              :loading="captchaLoading"
              class="h-10"
            >
              <img v-if="captchaImage" :src="captchaImage" alt="captcha" class="h-8 w-auto" />
              <span v-else>{{ $t('auth.refreshCaptcha') }}</span>
            </NButton>
          </div>
        </NFormItem>

        <!-- 邮箱验证码 -->
        <NFormItem :label="$t('auth.emailVerificationCode')" :show-feedback="false">
          <div class="flex gap-2">
            <NInput
              v-model:value="registerForm.emailVerificationCode"
              :placeholder="$t('auth.emailVerificationCodePlaceholder')"
              :disabled="!registerForm.captcha_code"
              class="flex-1"
            >
              <template #prefix>
                <SvgIcon icon="ic:outline-mail" class="text-lg" />
              </template>
            </NInput>
            <NButton
              :disabled="!registerForm.email || !registerForm.captcha_code || emailCodeCountdown > 0"
              @click="toSendEmailVerification"
              :loading="emailCodeLoading"
            >
              <template v-if="emailCodeCountdown > 0">
                {{ emailCodeCountdown }}s
              </template>
              <template v-else>
                {{ $t('auth.sendEmailCode') }}
              </template>
            </NButton>
          </div>
        </NFormItem>

        <NButton
          type="primary"
          :loading="loading"
          :disabled="!isRegisterFormValid"
          block
          @click="handleRegister"
          class="mt-4"
        >
          {{ $t('auth.register') }}
        </NButton>
      </div>

      <div class="mt-4 text-center">
        <NButton text @click="authType = authType === 'login' ? 'register' : 'login'">
          {{ authType === 'login' ? $t('auth.noAccount') : $t('auth.hasAccount') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NModal, NTabs, NTab, NButton, NInput, NFormItem, useMessage } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import {
  getCaptcha,
  verifyCaptcha,
  sendEmailVerification,
  register as registerApi,
  login as loginApi
} from '@/api'
import { useAuthStore } from '@/store'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const ms = useMessage()

// 表单状态
const authType = ref<'login' | 'register'>('login')
const loading = ref(false)
const captchaLoading = ref(false)
const emailCodeLoading = ref(false)
const emailCodeCountdown = ref(0)
const captchaImage = ref('')
const captchaKey = ref('')

// 登录表单
const loginForm = reactive({
  email: '',
  password: ''
})

// 注册表单
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  captcha_code: '',
  emailVerificationCode: ''
})

// 验证注册表单
const isRegisterFormValid = computed(() => {
  return (
    registerForm.email &&
    registerForm.password &&
    registerForm.confirmPassword &&
    registerForm.captcha_code &&
    registerForm.emailVerificationCode &&
    registerForm.password === registerForm.confirmPassword
  )
})

// 加载图形验证码
const loadCaptcha = async () => {
  try {
    captchaLoading.value = true
    const { data } = await getCaptcha()
    captchaImage.value = data.captcha_image
    captchaKey.value = data.captcha_key
  } catch (error: any) {
    ms.error(error.message || '获取验证码失败')
  } finally {
    captchaLoading.value = false
  }
}

// 发送邮箱验证码
const toSendEmailVerification = async () => {
  if (!registerForm.email) {
    ms.error('请先填写邮箱')
    return
  }

  if (!registerForm.captcha_code) {
    ms.error('请先填写图形验证码')
    return
  }

  try {
    emailCodeLoading.value = true
    const verifyResult = await verifyCaptcha({
      captcha_key: captchaKey.value,
			captcha_code: registerForm.captcha_code
    })
		console.log("这是verifyResult", verifyResult)
    if (verifyResult.code === 200) {
      // 发送邮箱验证码
      await sendEmailVerification({
        email: registerForm.email
      })
      ms.success('验证码已发送')

      // 开始倒计时
      emailCodeCountdown.value = 60
      const countdownTimer = setInterval(() => {
        emailCodeCountdown.value--
        if (emailCodeCountdown.value <= 0) {
          clearInterval(countdownTimer)
        }
      }, 1000)
    } else {
      ms.error('图形验证码错误')
    }
  } catch (error: any) {
    ms.error(error.message || '发送验证码失败')
  } finally {
    emailCodeLoading.value = false
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) return

  try {
    loading.value = true
    const { data } = await loginApi({
      email: loginForm.email,
      password: loginForm.password
    })

    // 保存token
    authStore.setAccessToken(data.access_token)
		authStore.setRefreshToken(data.access_token)
		await authStore.initializeAuth()
    ms.success('登录成功')

    // 关闭弹窗
    emit('update:visible', false)
    emit('close')
  } catch (error: any) {
    ms.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  if (!isRegisterFormValid.value) return

  try {
    loading.value = true
    await registerApi({
      email: registerForm.email,
      password: registerForm.password,
      confirm_password: registerForm.confirmPassword,
      email_verification_code: registerForm.emailVerificationCode
    })

    ms.success('注册成功')

    // 切换到登录页面
    authType.value = 'login'

    // 清空注册表单
    Object.assign(registerForm, {
      email: '',
      password: '',
      confirmPassword: '',
      captcha_code: '',
      emailVerificationCode: ''
    })
  } catch (error: any) {
    ms.error(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const onClose = () => {
  emit('update:visible', false)
  emit('close')
}

// 监听弹窗可见性，加载验证码
watch(() => props.visible, async (visible) => {
  if (visible) {
    authType.value = 'login'
    await loadCaptcha()

    // 清空表单
    Object.assign(loginForm, {
      email: '',
      password: ''
    })
    Object.assign(registerForm, {
      email: '',
      password: '',
      confirmPassword: '',
      captcha_code: '',
      emailVerificationCode: ''
    })
  }
}, { immediate: true })
</script>
