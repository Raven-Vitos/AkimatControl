<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-ice/70 to-canvas px-4 py-10">
    <AppLogo size="lg" class="mb-8" />
    <div class="w-full max-w-sm">
      <slot />
    </div>
    <p class="mt-8 text-xs text-muted">Akimat Control · демонстрационная версия</p>
  </div>
</template>
