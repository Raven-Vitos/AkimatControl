<script setup lang="ts">
const route = useRoute()
const { user, logout } = useAuth()

const navigation = [
  { to: '/', label: 'Обзор', icon: 'M4 5a1 1 0 0 1 1-1h5v7H4V5Zm10-1h5a1 1 0 0 1 1 1v3h-6V4ZM4 13h6v7H5a1 1 0 0 1-1-1v-6Zm10-3h6v9a1 1 0 0 1-1 1h-5V10Z' },
  { to: '/tasks', label: 'Поручения', icon: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === '/tasks' || /^\/tasks\/\d+/.test(route.path)
}

const menuOpen = ref(false)
watch(() => route.fullPath, () => (menuOpen.value = false))

const initials = computed(() =>
  (user.value?.name ?? '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <div class="min-h-screen lg:flex">
    <aside class="border-b border-line bg-surface lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
      <NuxtLink to="/" class="block px-5 py-4 lg:py-5">
        <AppLogo />
      </NuxtLink>

      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:pb-0">
        <div class="hidden px-3 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted/80 lg:block">Работа</div>
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition"
          :class="isActive(item.to) ? 'bg-lavender text-iris' : 'text-muted hover:bg-canvas hover:text-ink'"
        >
          <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="item.icon" />
          </svg>
          {{ item.label }}
        </NuxtLink>

        <div class="my-3 hidden border-t border-line lg:block" />

        <NuxtLink
          to="/tasks/new"
          class="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition"
          :class="route.path === '/tasks/new' ? 'bg-lavender text-iris' : 'text-brand hover:bg-ice'"
        >
          <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Создать поручение
        </NuxtLink>
      </nav>

      <div class="hidden px-5 py-4 text-xs text-muted/80 lg:block">Демонстрационная версия · MVP</div>
    </aside>

    <div class="flex-1 lg:pl-60">
      <header class="sticky top-0 z-20 flex h-14 items-center justify-end border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div v-if="user" class="relative">
          <button
            type="button"
            class="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <span class="flex size-8 items-center justify-center rounded-full bg-ice text-xs font-semibold text-brand">{{ initials }}</span>
            <span class="hidden leading-tight sm:block">
              <span class="block text-sm font-medium text-ink">{{ user.name }}</span>
              <span class="block text-xs text-muted">{{ user.position }}</span>
            </span>
            <svg class="size-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <template v-if="menuOpen">
            <div class="fixed inset-0 z-10" @click="menuOpen = false" />
            <div class="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg shadow-ink/5">
              <div class="border-b border-line px-4 py-2.5 sm:hidden">
                <div class="text-sm font-medium">{{ user.name }}</div>
                <div class="text-xs text-muted">{{ user.position }}</div>
              </div>
              <NuxtLink to="/profile" class="block px-4 py-2 text-sm text-ink hover:bg-canvas">Профиль</NuxtLink>
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft" @click="logout">Выйти</button>
            </div>
          </template>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
