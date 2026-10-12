<script setup lang="ts">
const props = defineProps<{ priority: PriorityValue }>()

// Bars read as a level at a glance; only critical gets the danger color
const LEVEL: Record<PriorityValue, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
const ACTIVE: Record<PriorityValue, string> = {
  LOW: 'bg-[#a9afbd]',
  MEDIUM: 'bg-brand',
  HIGH: 'bg-warn',
  CRITICAL: 'bg-danger',
}
</script>

<template>
  <span class="inline-flex items-center gap-2 whitespace-nowrap text-sm" :class="props.priority === 'CRITICAL' ? 'font-medium text-danger' : 'text-ink'">
    <span class="flex items-end gap-0.5" aria-hidden="true">
      <span
        v-for="bar in 4"
        :key="bar"
        class="w-[3px] rounded-sm"
        :class="bar <= LEVEL[props.priority] ? ACTIVE[props.priority] : 'bg-line'"
        :style="{ height: `${4 + bar * 2}px` }"
      />
    </span>
    {{ PRIORITY_LABELS[props.priority] }}
  </span>
</template>
