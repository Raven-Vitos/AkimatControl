<script setup lang="ts">
const props = defineProps<{
  rows: { id: number; name: string; active: number; overdue: number; completed: number; completedOnTime: number }[]
}>()

function onTimePercent(row: { completed: number; completedOnTime: number }) {
  return row.completed ? Math.round((row.completedOnTime / row.completed) * 100) : null
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2 class="card-title">По подразделениям</h2>
      <span class="text-xs text-muted">сортировка по просрочкам</span>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-line text-xs text-muted">
          <tr>
            <th class="px-5 py-2.5 font-medium">Подразделение</th>
            <th class="px-4 py-2.5 text-right font-medium">В работе</th>
            <th class="px-4 py-2.5 text-right font-medium">Просрочено</th>
            <th class="px-4 py-2.5 text-right font-medium">Выполнено</th>
            <th class="px-5 py-2.5 text-right font-medium">В срок</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="row in props.rows" :key="row.id" class="cursor-pointer transition hover:bg-canvas" @click="navigateTo({ path: '/tasks', query: { departmentId: row.id } })">
            <td class="px-5 py-2.5 text-ink">{{ row.name }}</td>
            <td class="px-4 py-2.5 text-right tabular-nums">{{ row.active }}</td>
            <td class="px-4 py-2.5 text-right tabular-nums" :class="row.overdue ? 'font-semibold text-danger' : 'text-muted'">{{ row.overdue }}</td>
            <td class="px-4 py-2.5 text-right tabular-nums text-muted">{{ row.completed }}</td>
            <td class="px-5 py-2.5 text-right tabular-nums text-muted">{{ onTimePercent(row) === null ? '—' : `${onTimePercent(row)}%` }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
