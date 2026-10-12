<script setup lang="ts">
const props = defineProps<{ deadline: string; daysLeft: number; state: DeadlineState }>()

const hint = computed(() => {
  if (props.state === 'overdue') return `просрочено на ${pluralDays(-props.daysLeft)}`
  if (props.state === 'soon') return props.daysLeft === 0 ? 'истекает сегодня' : `осталось ${pluralDays(props.daysLeft)}`
  return ''
})
</script>

<template>
  <div class="whitespace-nowrap">
    <div class="text-sm tabular-nums" :class="props.state === 'overdue' ? 'font-medium text-danger' : 'text-ink'">
      {{ formatDeadline(props.deadline) }}
    </div>
    <div v-if="hint" class="text-xs" :class="props.state === 'overdue' ? 'text-danger/80' : 'text-warn'">
      {{ hint }}
    </div>
  </div>
</template>
