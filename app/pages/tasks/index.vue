<script setup lang="ts">
useHead({ title: 'Поручения — Akimat Control' })

const route = useRoute()
const router = useRouter()
const { data: meta } = await useMeta()
const { user } = useAuth()

function queryValue(key: string) {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

// Filters live in the URL so dashboard links and the back button keep them
const filters = reactive({
  search: queryValue('search'),
  status: queryValue('status'),
  priority: queryValue('priority'),
  departmentId: queryValue('departmentId'),
  assigneeId: queryValue('assigneeId'),
  escalated: queryValue('escalated'),
})

const query = computed(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')))

watch(query, (value) => router.replace({ query: value }))

const { data: tasks, error, status } = await useFetch('/api/tasks', { query })

const hasFilters = computed(() => Object.keys(query.value).length > 0)

function resetFilters() {
  Object.assign(filters, { search: '', status: '', priority: '', departmentId: '', assigneeId: '', escalated: '' })
}

const myId = computed(() => String(user.value?.id ?? ''))
const onlyMine = computed({
  get: () => filters.assigneeId !== '' && filters.assigneeId === myId.value,
  set: (value) => (filters.assigneeId = value ? myId.value : ''),
})
const onlyEscalated = computed({
  get: () => filters.escalated === '1',
  set: (value) => (filters.escalated = value ? '1' : ''),
})

const exportUrl = computed(() => `/api/export/tasks?${new URLSearchParams(query.value)}`)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Поручения</h1>
        <p class="mt-0.5 text-sm text-muted">Найдено: {{ tasks?.length ?? 0 }}</p>
      </div>
      <NuxtLink to="/tasks/new" class="btn-primary">+ Создать поручение</NuxtLink>
    </div>

    <div class="card mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <input v-model.trim="filters.search" type="search" placeholder="Поиск по названию или номеру" class="field-input">
      <select v-model="filters.status" class="field-input">
        <option value="">Все статусы</option>
        <option v-for="value in TASK_STATUSES" :key="value" :value="value">{{ STATUS_LABELS[value] }}</option>
      </select>
      <select v-model="filters.priority" class="field-input">
        <option value="">Все приоритеты</option>
        <option v-for="value in PRIORITIES" :key="value" :value="value">{{ PRIORITY_LABELS[value] }}</option>
      </select>
      <select v-model="filters.departmentId" class="field-input">
        <option value="">Все подразделения</option>
        <option v-for="department in meta?.departments" :key="department.id" :value="String(department.id)">{{ department.name }}</option>
      </select>
      <button type="button" class="btn-secondary" :disabled="!hasFilters" @click="resetFilters">Сбросить</button>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-sm sm:col-span-2 lg:col-span-5">
        <label class="flex cursor-pointer items-center gap-2 text-ink">
          <input v-model="onlyMine" type="checkbox" class="size-4 accent-brand">
          Назначены мне
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-ink">
          <input v-model="onlyEscalated" type="checkbox" class="size-4 accent-brand">
          Только эскалированные
        </label>
        <a :href="exportUrl" class="link ml-auto" download>Экспорт в CSV</a>
      </div>
    </div>

    <div class="card overflow-hidden" :class="{ 'opacity-60': status === 'pending' }">
      <div v-if="error" class="p-5 text-sm text-danger">{{ getErrorMessage(error, 'Не удалось загрузить поручения') }}</div>
      <TasksTaskTable v-else :tasks="tasks ?? []" />
    </div>
  </div>
</template>
