<script setup lang="ts">
definePageMeta({ layout: 'auth', alias: ['/registration'] })
useHead({ title: 'Регистрация — Akimat Control' })

const { data: departments } = await useFetch('/api/auth/departments')

const form = reactive({ name: '', email: '', departmentId: null as number | null, password: '', passwordConfirm: '' })
const submitting = ref(false)
const error = ref('')
const { user } = useAuth()

async function submit() {
  if (form.password !== form.passwordConfirm) {
    error.value = 'Пароли не совпадают'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    // Registration also starts a session, so the user lands on the dashboard right away
    user.value = await $fetch<AuthUser>('/api/auth/register' as string, { method: 'POST', body: form })
    await navigateTo('/')
  } catch (registerError) {
    error.value = getErrorMessage(registerError, 'Не удалось зарегистрироваться')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="card space-y-4 p-6 shadow-sm shadow-ink/5" @submit.prevent="submit">
    <h1 class="text-lg font-semibold">Регистрация</h1>
    <div>
      <label class="field-label" for="name">Имя</label>
      <input id="name" v-model.trim="form.name" required autocomplete="name" class="field-input" placeholder="Фамилия Имя">
    </div>
    <div>
      <label class="field-label" for="email">Email</label>
      <input id="email" v-model.trim="form.email" type="email" required autocomplete="email" class="field-input">
    </div>
    <div>
      <label class="field-label" for="department">Подразделение</label>
      <select id="department" v-model="form.departmentId" required class="field-input">
        <option :value="null" disabled>Выберите подразделение</option>
        <option v-for="department in departments" :key="department.id" :value="department.id">{{ department.name }}</option>
      </select>
    </div>
    <div>
      <label class="field-label" for="password">Пароль</label>
      <input id="password" v-model="form.password" type="password" required minlength="6" autocomplete="new-password" class="field-input">
    </div>
    <div>
      <label class="field-label" for="password-confirm">Подтверждение пароля</label>
      <input id="password-confirm" v-model="form.passwordConfirm" type="password" required autocomplete="new-password" class="field-input">
    </div>
    <p v-if="error" class="alert-error">{{ error }}</p>
    <button type="submit" class="btn-primary w-full" :disabled="submitting">{{ submitting ? 'Создание…' : 'Создать аккаунт' }}</button>
    <p class="text-center text-sm text-muted">
      Уже есть аккаунт? <NuxtLink to="/login" class="link">Войти</NuxtLink>
    </p>
  </form>
</template>
