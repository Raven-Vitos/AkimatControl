<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'sm' })
</script>

<template>
  <div class="flex items-center gap-2.5">
    <img src="/favicon.svg" alt="" :class="props.size === 'lg' ? 'size-10' : 'size-8'">
    <div class="leading-tight">
      <div class="font-semibold tracking-tight text-ink" :class="props.size === 'lg' ? 'text-lg' : 'text-sm'">Akimat Control</div>
      <div class="text-muted" :class="props.size === 'lg' ? 'text-sm' : 'text-xs'">Контроль поручений</div>
    </div>
  </div>
</template>
