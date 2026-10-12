<script setup lang="ts">
definePageMeta({ alias: ['/dashboard'] })
useHead({ title: 'Обзор — Akimat Control' })

const { data: dashboard, error, refresh } = await useFetch('/api/dashboard')
const { user } = useAuth()

const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

function percentOfTotal(value: number) {
  const total = dashboard.value?.stats.total ?? 0
  return total ? `${Math.round((value / total) * 100)}%` : ''
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Обзор</h1>
        <p class="mt-0.5 text-sm text-muted">Контроль исполнения поручений · Сегодня, {{ today }}</p>
      </div>
      <NuxtLink to="/tasks/new" class="btn-primary">+ Создать поручение</NuxtLink>
    </div>

    <div v-if="error" class="card p-5 text-sm text-danger">{{ getErrorMessage(error, 'Не удалось загрузить данные') }}</div>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatCard label="Всего" :value="dashboard.stats.total" tone="neutral" to="/tasks" />
        <DashboardStatCard label="В работе" :value="dashboard.stats.inProgress" tone="blue" :hint="percentOfTotal(dashboard.stats.inProgress)" :to="{ path: '/tasks', query: { status: 'IN_PROGRESS' } }" />
        <DashboardStatCard label="Выполнено" :value="dashboard.stats.completed" tone="green" :hint="percentOfTotal(dashboard.stats.completed)" :to="{ path: '/tasks', query: { status: 'COMPLETED' } }" />
        <DashboardStatCard label="Просрочено" :value="dashboard.stats.overdue" tone="red" :hint="percentOfTotal(dashboard.stats.overdue)" :to="{ path: '/tasks', query: { status: 'OVERDUE' } }" />
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-3">
        <DashboardDeadlineAlerts class="lg:col-span-2" :overdue="dashboard.overdue" :due-soon="dashboard.dueSoon" @changed="refresh" />
        <div class="space-y-5">
          <NuxtLink
            v-if="user"
            :to="{ path: '/tasks', query: { assigneeId: user.id } }"
            class="card flex items-center justify-between gap-3 p-4 transition hover:border-brand/40"
          >
            <div>
              <div class="text-xs text-muted">Мои поручения</div>
              <div class="mt-0.5 text-sm text-ink">
                <template v-if="dashboard.mine.active">
                  {{ dashboard.mine.active }} в работе<span v-if="dashboard.mine.overdue" class="font-medium text-danger"> · {{ dashboard.mine.overdue }} просрочено</span>
                </template>
                <template v-else>Нет активных поручений</template>
              </div>
            </div>
            <span class="text-muted">→</span>
          </NuxtLink>
          <DashboardStatusDistribution class="h-fit" :by-status="dashboard.byStatus" />
        </div>
      </div>

      <DashboardDepartmentSummary class="mt-5" :rows="dashboard.byDepartment" />

      <section class="card mt-5">
        <div class="card-header">
          <h2 class="card-title">Последние поручения</h2>
          <NuxtLink to="/tasks" class="link text-sm">Все поручения →</NuxtLink>
        </div>
        <TasksTaskTable :tasks="dashboard.recent" compact />
      </section>
    </template>
  </div>
</template>
