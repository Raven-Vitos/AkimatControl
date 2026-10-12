<script setup lang="ts">
const props = defineProps<{ byStatus: Record<TaskStatusValue, number> }>()

const COLORS: Record<TaskStatusValue, string> = {
  NEW: 'bg-brand',
  IN_PROGRESS: 'bg-[#8a91a5]',
  REVIEW: 'bg-iris',
  COMPLETED: 'bg-ok',
  OVERDUE: 'bg-danger',
}

const total = computed(() => Object.values(props.byStatus).reduce((sum, count) => sum + count, 0))
const rows = computed(() =>
  TASK_STATUSES.map((status) => ({
    status,
    count: props.byStatus[status],
    percent: total.value ? (props.byStatus[status] / total.value) * 100 : 0,
  })),
)
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2 class="card-title">По статусам</h2>
      <span class="text-xs text-muted">{{ total }} всего</span>
    </div>
    <div class="p-5">
      <div class="flex h-2 gap-0.5 overflow-hidden rounded-full bg-canvas">
        <div v-for="row in rows" :key="row.status" :class="COLORS[row.status]" :style="{ width: `${row.percent}%` }" />
      </div>
      <ul class="mt-4 space-y-1">
        <li v-for="row in rows" :key="row.status">
          <NuxtLink
            :to="{ path: '/tasks', query: { status: row.status } }"
            class="-mx-2 flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition hover:bg-canvas"
          >
            <span class="flex items-center gap-2 text-ink">
              <span class="size-2 rounded-full" :class="COLORS[row.status]" />
              {{ STATUS_LABELS[row.status] }}
            </span>
            <span class="tabular-nums text-muted">{{ row.count }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
