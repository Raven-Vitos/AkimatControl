<script setup lang="ts">
export interface TaskFormValue {
  title: string
  description: string
  departmentId: number | null
  assigneeId: number | null
  deadline: string
  priority: PriorityValue
}

const model = defineModel<TaskFormValue>({ required: true })
const props = defineProps<{ submitting: boolean; highlight?: Partial<Record<keyof TaskFormValue, boolean>> }>()
const emit = defineEmits<{ submit: [] }>()

const { data: meta } = await useMeta()

const departmentUsers = computed(() => meta.value?.users.filter((user) => user.departmentId === model.value.departmentId) ?? [])

// Default the assignee to the department head; keep the user's choice if it still fits the department
watch(
  () => model.value.departmentId,
  () => {
    if (departmentUsers.value.some((user) => user.id === model.value.assigneeId)) return
    const head = departmentUsers.value.find((user) => user.role === 'MANAGER') ?? departmentUsers.value[0]
    model.value.assigneeId = head?.id ?? null
  },
  { immediate: true },
)

const today = toDateKey(new Date())

function fieldClass(field: keyof TaskFormValue) {
  return props.highlight?.[field] ? 'field-input border-iris/40 bg-lavender/40' : 'field-input'
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <div>
      <label class="field-label" for="title">Название <span class="text-danger">*</span></label>
      <input id="title" v-model="model.title" required maxlength="200" :class="fieldClass('title')" placeholder="Например: Восстановить освещение на ул. Абая">
    </div>

    <div>
      <label class="field-label" for="description">Описание</label>
      <textarea id="description" v-model="model.description" rows="4" maxlength="5000" :class="fieldClass('description')" />
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="field-label" for="department">Ответственное подразделение <span class="text-danger">*</span></label>
        <select id="department" v-model="model.departmentId" required :class="fieldClass('departmentId')">
          <option :value="null" disabled>Выберите подразделение</option>
          <option v-for="department in meta?.departments" :key="department.id" :value="department.id">{{ department.name }}</option>
        </select>
      </div>
      <div>
        <label class="field-label" for="assignee">Ответственный <span class="text-danger">*</span></label>
        <select id="assignee" v-model="model.assigneeId" required class="field-input" :disabled="!model.departmentId">
          <option :value="null" disabled>{{ model.departmentId ? 'Выберите исполнителя' : 'Сначала выберите подразделение' }}</option>
          <option v-for="user in departmentUsers" :key="user.id" :value="user.id">{{ user.name }} — {{ user.position }}</option>
        </select>
      </div>
      <div>
        <label class="field-label" for="deadline">Срок исполнения <span class="text-danger">*</span></label>
        <input id="deadline" v-model="model.deadline" type="date" required :min="today" :class="fieldClass('deadline')">
      </div>
      <div>
        <label class="field-label" for="priority">Приоритет <span class="text-danger">*</span></label>
        <select id="priority" v-model="model.priority" required :class="fieldClass('priority')">
          <option v-for="value in PRIORITIES" :key="value" :value="value">{{ PRIORITY_LABELS[value] }}</option>
        </select>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <NuxtLink to="/tasks" class="btn-secondary">Отмена</NuxtLink>
      <button type="submit" class="btn-primary" :disabled="props.submitting">
        {{ props.submitting ? 'Сохранение…' : 'Создать поручение' }}
      </button>
    </div>
  </form>
</template>
