<script setup lang="ts">
interface HistoryItem {
  id: number
  action: string
  description: string
  createdAt: string
  user: { name: string } | null
}

const props = defineProps<{ history: HistoryItem[]; deadline: string; deadlineState: DeadlineState }>()

const DOT: Record<string, string> = {
  CREATED: 'bg-brand',
  ASSIGNED: 'bg-brand/60',
  STARTED: 'bg-[#8a91a5]',
  SENT_TO_REVIEW: 'bg-iris',
  RETURNED: 'bg-warn',
  COMPLETED: 'bg-ok',
  OVERDUE: 'bg-danger',
  ESCALATED: 'bg-danger',
  UPDATED: 'bg-[#a9afbd]',
}

type TimelineEntry =
  | { kind: 'event'; key: string; date: string; item: HistoryItem }
  | { kind: 'deadline'; key: string; date: string }

// The deadline is not a history event, but showing it on the timeline makes the overdue gap visible
const entries = computed<TimelineEntry[]>(() => {
  const deadlineEnd = new Date(`${props.deadline}T23:59:59`).toISOString()
  const list: TimelineEntry[] = props.history.map((item) => ({ kind: 'event', key: `e${item.id}`, date: item.createdAt, item }))
  const index = list.findIndex((entry) => entry.date > deadlineEnd)
  const marker: TimelineEntry = { kind: 'deadline', key: 'deadline', date: deadlineEnd }
  if (index === -1) list.push(marker)
  else list.splice(index, 0, marker)
  return list
})
</script>

<template>
  <ol class="relative ml-2 border-l border-line">
    <li v-for="entry in entries" :key="entry.key" class="mb-5 ml-5 last:mb-0">
      <template v-if="entry.kind === 'event'">
        <span class="absolute -left-1.5 mt-1.5 size-3 rounded-full ring-4 ring-surface" :class="DOT[entry.item.action] ?? 'bg-[#a9afbd]'" />
        <div class="text-xs text-muted">{{ formatDateTime(entry.item.createdAt) }}</div>
        <div class="text-sm font-medium" :class="['OVERDUE', 'ESCALATED'].includes(entry.item.action) ? 'text-danger' : 'text-ink'">
          {{ entry.item.description }}
        </div>
        <div v-if="entry.item.user" class="text-xs text-muted">{{ entry.item.user.name }}</div>
      </template>
      <template v-else>
        <span
          class="absolute -left-1.5 mt-1.5 size-3 rotate-45 ring-4 ring-surface"
          :class="props.deadlineState === 'overdue' ? 'bg-danger' : props.deadlineState === 'done' ? 'bg-ok' : 'bg-warn'"
        />
        <div class="text-xs text-muted">{{ formatDeadline(props.deadline) }}</div>
        <div class="text-sm font-medium text-ink">Срок исполнения</div>
      </template>
    </li>
  </ol>
</template>
