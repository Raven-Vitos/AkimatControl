<script setup lang="ts">
type TaskAction = 'start' | 'review' | 'return' | 'complete' | 'escalate'

const route = useRoute()
const { data: task, error, refresh } = await useFetch(`/api/tasks/${route.params.id}`)

useHead({ title: () => (task.value ? `№${task.value.number} — Akimat Control` : 'Поручение — Akimat Control') })

const { data: meta } = await useMeta()

const actionError = ref('')
const pendingAction = ref<string | null>(null)
const comment = ref('')

const actions = computed(() => {
  if (!task.value) return []
  const list: { action: TaskAction; label: string; style: string }[] = []
  if (task.value.status === 'NEW') list.push({ action: 'start', label: 'Начать работу', style: 'btn-primary' })
  if (task.value.status === 'IN_PROGRESS') list.push({ action: 'review', label: 'Отправить на проверку', style: 'btn-primary' })
  if (task.value.status === 'REVIEW') {
    list.push({ action: 'complete', label: 'Выполнить', style: 'btn-success' })
    list.push({ action: 'return', label: 'Вернуть на доработку', style: 'btn-secondary' })
  }
  return list
})

const needsEscalation = computed(() => task.value?.deadlineState === 'overdue' && !task.value.isEscalated)

async function patchTask(body: Record<string, unknown>, key: string) {
  pendingAction.value = key
  actionError.value = ''
  try {
    // Typed via task.value: inferring the Nitro route type here exceeds the TS stack depth
    task.value = await $fetch<NonNullable<typeof task.value>>(`/api/tasks/${route.params.id}` as string, { method: 'PATCH', body })
    return true
  } catch (patchError) {
    actionError.value = getErrorMessage(patchError, 'Не удалось выполнить действие')
    await refresh()
    return false
  } finally {
    pendingAction.value = null
  }
}

async function runAction(action: TaskAction) {
  if (await patchTask({ action, comment: comment.value }, action)) comment.value = ''
}

const editingAssignee = ref(false)
const newAssigneeId = ref<number | null>(null)

const usersByDepartment = computed(() =>
  (meta.value?.departments ?? []).map((department) => ({
    department,
    users: meta.value?.users.filter((user) => user.departmentId === department.id) ?? [],
  })),
)

function startAssigneeEdit() {
  newAssigneeId.value = task.value?.assignee.id ?? null
  editingAssignee.value = true
}

async function saveAssignee() {
  if (await patchTask({ assigneeId: newAssigneeId.value }, 'assignee')) editingAssignee.value = false
}

const editingDeadline = ref(false)
const newDeadline = ref('')

function startDeadlineEdit() {
  newDeadline.value = task.value?.deadline ?? ''
  editingDeadline.value = true
}

async function saveDeadline() {
  if (await patchTask({ deadline: newDeadline.value }, 'deadline')) editingDeadline.value = false
}
</script>

<template>
  <div>
    <NuxtLink to="/tasks" class="text-sm text-muted hover:text-ink">← К списку поручений</NuxtLink>

    <div v-if="error" class="card mt-4 p-5 text-sm text-danger">{{ getErrorMessage(error, 'Не удалось загрузить поручение') }}</div>

    <template v-else-if="task">
      <div class="mb-5 mt-2 min-w-0">
        <div class="text-sm text-muted">Поручение №{{ task.number }}</div>
        <h1 class="page-title mt-0.5">{{ task.title }}</h1>
        <div class="mt-2.5 flex flex-wrap items-center gap-2">
          <UiStatusBadge :status="task.effectiveStatus" />
          <span v-if="task.effectiveStatus === 'OVERDUE'" class="text-xs text-muted">этап: {{ STATUS_LABELS[task.status] }}</span>
          <span v-if="task.isEscalated" class="inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
            <span class="size-1.5 rounded-full bg-danger" />Эскалировано
          </span>
        </div>
      </div>

      <!-- Escalation / reminder banners -->
      <div v-if="needsEscalation" class="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-danger/25 bg-danger-soft p-4">
        <div class="flex gap-3">
          <svg class="mt-0.5 size-5 shrink-0 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          <div>
            <div class="text-sm font-semibold text-danger">Требуется эскалация</div>
            <div class="text-sm text-ink/80">Поручение просрочено на {{ pluralDays(-task.daysLeft) }}. Требуется внимание руководителя.</div>
          </div>
        </div>
        <button type="button" class="btn-danger" :disabled="pendingAction !== null" @click="runAction('escalate')">
          {{ pendingAction === 'escalate' ? 'Эскалация…' : 'Эскалировать' }}
        </button>
      </div>
      <div v-else-if="task.deadlineState === 'overdue' && task.escalatedAt" class="mb-5 flex gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4">
        <span class="mt-1.5 size-2 shrink-0 rounded-full bg-danger" />
        <div>
          <div class="text-sm font-semibold text-danger">Эскалировано руководителю</div>
          <div class="text-sm text-ink/80">
            {{ formatDateTime(task.escalatedAt) }} · Поручение просрочено на {{ pluralDays(-task.daysLeft) }}.
          </div>
        </div>
      </div>
      <div v-else-if="task.deadlineState === 'soon'" class="mb-5 flex items-center gap-3 rounded-xl border border-warn/25 bg-warn-soft p-4 text-sm text-ink">
        <span class="size-2 shrink-0 rounded-full bg-warn" />
        {{ task.daysLeft === 0 ? 'Срок исполнения истекает сегодня.' : `Срок исполнения истекает через ${pluralDays(task.daysLeft)}.` }}
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <section class="card p-5">
            <h2 class="card-title mb-2">Описание</h2>
            <p class="whitespace-pre-line text-sm leading-relaxed text-ink/85">{{ task.description || 'Описание не указано' }}</p>
          </section>

          <section class="card p-5">
            <h2 class="card-title mb-3">Действия</h2>
            <div v-if="task.status !== 'COMPLETED'" class="mb-3">
              <label class="field-label" for="comment">
                Комментарий <span class="font-normal text-muted">{{ task.status === 'REVIEW' ? '— обязателен при возврате на доработку' : '— необязательно, попадёт в историю' }}</span>
              </label>
              <textarea id="comment" v-model="comment" rows="2" maxlength="500" class="field-input" placeholder="Например: не приложен акт выполненных работ" />
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <button
                v-for="item in actions"
                :key="item.action"
                type="button"
                :class="item.style"
                :disabled="pendingAction !== null || (item.action === 'return' && !comment.trim())"
                @click="runAction(item.action)"
              >
                {{ pendingAction === item.action ? 'Сохранение…' : item.label }}
              </button>
              <p v-if="task.status === 'COMPLETED'" class="flex items-center gap-2 text-sm text-ok">
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                Поручение выполнено{{ task.completedAt ? ` ${formatDateTime(task.completedAt)}` : '' }}
              </p>
            </div>
            <p v-if="actionError" class="alert-error mt-3">{{ actionError }}</p>
          </section>

          <section class="card p-5">
            <h2 class="card-title mb-4">История</h2>
            <TasksTaskTimeline :history="task.history" :deadline="task.deadline" :deadline-state="task.deadlineState" />
          </section>
        </div>

        <aside class="card h-fit">
          <dl class="divide-y divide-line text-sm">
            <div class="px-5 py-3.5">
              <dt class="text-xs text-muted">Срок исполнения</dt>
              <dd v-if="!editingDeadline" class="mt-1 flex items-start justify-between gap-2">
                <UiDeadlineText :deadline="task.deadline" :days-left="task.daysLeft" :state="task.deadlineState" />
                <button v-if="task.status !== 'COMPLETED'" type="button" class="link text-xs" @click="startDeadlineEdit">Изменить</button>
              </dd>
              <dd v-else class="mt-1 flex gap-2">
                <input v-model="newDeadline" type="date" class="field-input py-1">
                <button type="button" class="btn-primary px-3 py-1" :disabled="!newDeadline || pendingAction !== null" @click="saveDeadline">OK</button>
                <button type="button" class="btn-secondary px-3 py-1" @click="editingDeadline = false">✕</button>
              </dd>
            </div>
            <div class="px-5 py-3.5">
              <dt class="text-xs text-muted">Приоритет</dt>
              <dd class="mt-1"><UiPriorityBadge :priority="task.priority" /></dd>
            </div>
            <div class="px-5 py-3.5">
              <dt class="text-xs text-muted">Ответственный</dt>
              <template v-if="!editingAssignee">
                <dd class="mt-1 flex items-start justify-between gap-2">
                  <span class="font-medium">{{ task.assignee.name }}</span>
                  <button v-if="task.status !== 'COMPLETED'" type="button" class="link text-xs" @click="startAssigneeEdit">Переназначить</button>
                </dd>
                <dd class="text-xs text-muted">{{ task.assignee.position }}</dd>
              </template>
              <dd v-else class="mt-1 flex gap-2">
                <select v-model="newAssigneeId" class="field-input min-w-0 py-1">
                  <optgroup v-for="group in usersByDepartment" :key="group.department.id" :label="group.department.name">
                    <option v-for="user in group.users" :key="user.id" :value="user.id">{{ user.name }}</option>
                  </optgroup>
                </select>
                <button type="button" class="btn-primary px-3 py-1" :disabled="!newAssigneeId || pendingAction !== null" @click="saveAssignee">OK</button>
                <button type="button" class="btn-secondary px-3 py-1" @click="editingAssignee = false">✕</button>
              </dd>
            </div>
            <div class="px-5 py-3.5">
              <dt class="text-xs text-muted">Подразделение</dt>
              <dd class="mt-1">{{ task.department.name }}</dd>
            </div>
            <div class="px-5 py-3.5">
              <dt class="text-xs text-muted">Автор поручения</dt>
              <dd class="mt-1">{{ task.createdBy.name }}</dd>
            </div>
            <div class="px-5 py-3.5">
              <dt class="text-xs text-muted">Создано</dt>
              <dd class="mt-1">{{ formatDateTime(task.createdAt) }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </div>
</template>
