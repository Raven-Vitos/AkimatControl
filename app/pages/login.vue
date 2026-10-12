<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Вход — Akimat Control' })

const DEMO = { email: 'd.akhmetova@akimat.demo', password: 'demo1234' }

const form = reactive({ email: '', password: '' })
const submitting = ref(false)
const error = ref('')
const { user } = useAuth()

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    user.value = await $fetch<AuthUser>('/api/auth/login' as string, { method: 'POST', body: form })
    await navigateTo('/')
  } catch (loginError) {
    error.value = getErrorMessage(loginError, 'Не удалось войти')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <form class="card space-y-4 p-6 shadow-sm shadow-ink/5" @submit.prevent="submit">
      <h1 class="text-lg font-semibold">Вход в систему</h1>
      <div>
        <label class="field-label" for="email">Email</label>
        <input id="email" v-model.trim="form.email" type="email" required autocomplete="email" class="field-input">
      </div>
      <div>
        <label class="field-label" for="password">Пароль</label>
        <input id="password" v-model="form.password" type="password" required autocomplete="current-password" class="field-input">
      </div>
      <p v-if="error" class="alert-error">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="submitting">{{ submitting ? 'Вход…' : 'Войти' }}</button>
      <p class="text-center text-sm text-muted">
        Нет аккаунта? <NuxtLink to="/register" class="link">Зарегистрироваться</NuxtLink>
      </p>
    </form>

    <button
      type="button"
      class="mt-4 w-full rounded-xl border border-dashed border-line px-4 py-3 text-left text-xs text-muted transition hover:border-brand/40 hover:bg-surface"
      @click="Object.assign(form, DEMO)"
    >
      <span class="font-medium text-ink">Демо-доступ</span> — нажмите, чтобы подставить<br>
      {{ DEMO.email }} / {{ DEMO.password }}
    </button>
  </div>
</template>
