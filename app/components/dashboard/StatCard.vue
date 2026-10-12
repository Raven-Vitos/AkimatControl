<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{ label: string; value: number; tone: 'neutral' | 'blue' | 'green' | 'red'; to: RouteLocationRaw; hint?: string }>()

const DOT = {
  neutral: 'bg-[#a9afbd]',
  blue: 'bg-brand',
  green: 'bg-ok',
  red: 'bg-danger',
}
</script>

<template>
  <NuxtLink :to="props.to" class="card group block px-5 py-4 transition hover:border-brand/30">
    <div class="flex items-center gap-2 text-sm text-muted">
      <span class="size-2 rounded-full" :class="DOT[props.tone]" />
      {{ props.label }}
    </div>
    <div class="mt-2 flex items-baseline justify-between gap-2">
      <span class="text-3xl font-semibold tabular-nums tracking-tight" :class="props.tone === 'red' && props.value > 0 ? 'text-danger' : 'text-ink'">
        {{ props.value }}
      </span>
      <span v-if="props.hint" class="text-xs text-muted">{{ props.hint }}</span>
    </div>
  </NuxtLink>
</template>
