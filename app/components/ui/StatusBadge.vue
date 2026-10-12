<script setup lang="ts">
const props = defineProps<{ status: TaskStatusValue }>()

const STYLES: Record<TaskStatusValue, { badge: string; dot: string }> = {
  NEW: { badge: 'bg-ice text-brand-dark', dot: 'bg-brand' },
  IN_PROGRESS: { badge: 'bg-[#eef0f5] text-[#4a5168]', dot: 'bg-[#8a91a5]' },
  REVIEW: { badge: 'bg-lavender text-iris', dot: 'bg-iris' },
  COMPLETED: { badge: 'bg-ok-soft text-ok', dot: 'bg-ok' },
  OVERDUE: { badge: 'bg-danger-soft text-danger', dot: 'bg-danger' },
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium" :class="STYLES[props.status].badge">
    <span class="size-1.5 rounded-full" :class="STYLES[props.status].dot" />
    {{ STATUS_LABELS[props.status] }}
  </span>
</template>
