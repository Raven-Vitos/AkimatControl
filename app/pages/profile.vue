<script setup lang="ts">
useHead({ title: 'Профиль — Akimat Control' })

const { user, logout } = useAuth()

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Руководитель', EMPLOYEE: 'Сотрудник' }
</script>

<template>
  <div v-if="user" class="max-w-xl">
    <h1 class="page-title mb-6">Профиль</h1>
    <div class="card">
      <dl class="divide-y divide-line text-sm">
        <div class="grid grid-cols-3 gap-4 px-5 py-3"><dt class="text-muted">Имя</dt><dd class="col-span-2 font-medium">{{ user.name }}</dd></div>
        <div class="grid grid-cols-3 gap-4 px-5 py-3"><dt class="text-muted">Email</dt><dd class="col-span-2">{{ user.email }}</dd></div>
        <div class="grid grid-cols-3 gap-4 px-5 py-3"><dt class="text-muted">Должность</dt><dd class="col-span-2">{{ user.position }}</dd></div>
        <div class="grid grid-cols-3 gap-4 px-5 py-3"><dt class="text-muted">Подразделение</dt><dd class="col-span-2">{{ user.department.name }}</dd></div>
        <div class="grid grid-cols-3 gap-4 px-5 py-3"><dt class="text-muted">Роль</dt><dd class="col-span-2">{{ ROLE_LABELS[user.role] ?? user.role }}</dd></div>
      </dl>
    </div>
    <button type="button" class="btn-secondary mt-4" @click="logout">Выйти</button>
  </div>
</template>
