<script setup lang="ts">
import type { TaskRow } from '#shared/types/task'

const props = defineProps<{ overdue: TaskRow[]; dueSoon: TaskRow[] }>()
const emit = defineEmits<{ changed: [] }>()

const total = computed(() => props.overdue.length + props.dueSoon.length)

function soonText(task: TaskRow) {
  return task.daysLeft === 0 ? 'Срок истекает сегодня' : `Срок истекает через ${pluralDays(task.daysLeft)}`
}

const escalatingId = ref<number | null>(null)
const error = ref('')

async function escalate(task: TaskRow) {
  escalatingId.value = task.id
  error.value = ''
  try {
    await $fetch(`/api/tasks/${task.id}` as string, { method: 'PATCH', body: { action: 'escalate' } })
    emit('changed')
  } catch (escalateError) {
    error.value = getErrorMessage(escalateError, 'Не удалось эскалировать поручение')
  } finally {
    escalatingId.value = null
  }
}
</script>

<template>
  <section class="card overflow-hidden">
    <div class="card-header">
      <h2 class="card-title">Требуют внимания</h2>
      <span
        class="rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums"
        :class="props.overdue.length ? 'bg-danger-soft text-danger' : 'bg-canvas text-muted'"
      >{{ total }}</span>
    </div>

    <p v-if="error" class="alert-error mx-5 mt-3">{{ error }}</p>

    <ul class="divide-y divide-line">
      <li v-for="task in props.overdue" :key="task.id" class="relative px-5 py-3.5 transition hover:bg-danger-soft/40">
        <span class="absolute inset-y-3 left-0 w-[3px] rounded-r bg-danger" />
        <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <NuxtLink :to="`/tasks/${task.id}`" class="min-w-0 flex-1">
            <div class="flex items-center gap-2 text-xs text-muted">
              <span class="size-1.5 rounded-full bg-danger" />
              Поручение №{{ task.number }}
            </div>
            <div class="mt-0.5 truncate text-sm font-medium text-ink">{{ task.title }}</div>
            <div class="mt-0.5 text-xs font-medium text-danger">Срок просрочен на {{ pluralDays(-task.daysLeft) }}</div>
          </NuxtLink>
          <div class="flex items-center gap-3 self-center">
            <span class="hidden text-xs text-muted sm:inline">{{ task.assignee.name }}</span>
            <span v-if="task.isEscalated" class="whitespace-nowrap rounded-md bg-danger-soft px-2 py-1 text-xs font-medium text-danger">Эскалировано</span>
            <button
              v-else
              type="button"
              class="btn-sm btn border border-danger/30 bg-surface text-danger hover:bg-danger-soft"
              :disabled="escalatingId !== null"
              @click="escalate(task)"
            >
              {{ escalatingId === task.id ? 'Эскалация…' : 'Эскалировать' }}
            </button>
          </div>
        </div>
      </li>

      <li v-for="task in props.dueSoon" :key="task.id" class="relative px-5 py-3.5 transition hover:bg-warn-soft/50">
        <span class="absolute inset-y-3 left-0 w-[3px] rounded-r bg-warn/70" />
        <NuxtLink :to="`/tasks/${task.id}`" class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 text-xs text-muted">
              <span class="size-1.5 rounded-full bg-warn" />
              Поручение №{{ task.number }}
            </div>
            <div class="mt-0.5 truncate text-sm font-medium text-ink">{{ task.title }}</div>
            <div class="mt-0.5 text-xs font-medium text-warn">{{ soonText(task) }}</div>
          </div>
          <span class="hidden self-center text-xs text-muted sm:inline">{{ task.assignee.name }}</span>
        </NuxtLink>
      </li>

      <li v-if="total === 0" class="px-5 py-10 text-center text-sm text-muted">
        Просроченных поручений и приближающихся сроков нет
      </li>
    </ul>
  </section>
</template>
