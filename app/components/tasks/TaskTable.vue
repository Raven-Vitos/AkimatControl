<script setup lang="ts">
import type { TaskRow } from '#shared/types/task'

const props = withDefaults(defineProps<{ tasks: TaskRow[]; compact?: boolean }>(), { compact: false })
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full text-left">
      <thead class="border-b border-line text-xs font-medium text-muted">
        <tr>
          <th class="px-5 py-2.5 font-medium">№</th>
          <th class="px-4 py-2.5 font-medium">Название</th>
          <th class="px-4 py-2.5 font-medium">Ответственный</th>
          <th v-if="!props.compact" class="px-4 py-2.5 font-medium">Подразделение</th>
          <th class="px-4 py-2.5 font-medium">Приоритет</th>
          <th class="px-4 py-2.5 font-medium">Срок</th>
          <th class="px-4 py-2.5 font-medium">Статус</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr
          v-for="task in props.tasks"
          :key="task.id"
          class="cursor-pointer transition"
          :class="task.deadlineState === 'overdue' ? 'bg-danger-soft/35 hover:bg-danger-soft/60' : 'hover:bg-canvas'"
          @click="navigateTo(`/tasks/${task.id}`)"
        >
          <td class="relative px-5 py-3 text-sm tabular-nums text-muted">
            <span v-if="task.deadlineState === 'overdue'" class="absolute inset-y-2 left-0 w-[3px] rounded-r bg-danger" />
            {{ task.number }}
          </td>
          <td class="px-4 py-3">
            <NuxtLink :to="`/tasks/${task.id}`" class="text-sm font-medium text-ink hover:text-brand" @click.stop>
              {{ task.title }}
            </NuxtLink>
            <span v-if="task.isEscalated" class="ml-2 whitespace-nowrap rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-medium text-danger">Эскалировано</span>
          </td>
          <td class="whitespace-nowrap px-4 py-3 text-sm text-ink">{{ task.assignee.name }}</td>
          <td v-if="!props.compact" class="whitespace-nowrap px-4 py-3 text-sm text-muted">{{ task.department.name }}</td>
          <td class="px-4 py-3"><UiPriorityBadge :priority="task.priority" /></td>
          <td class="px-4 py-3"><UiDeadlineText :deadline="task.deadline" :days-left="task.daysLeft" :state="task.deadlineState" /></td>
          <td class="px-4 py-3"><UiStatusBadge :status="task.effectiveStatus" /></td>
        </tr>
        <tr v-if="props.tasks.length === 0">
          <td colspan="7" class="px-4 py-10 text-center text-sm text-muted">Поручения не найдены</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
