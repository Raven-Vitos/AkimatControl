<script setup lang="ts">
import type { TaskFormValue } from '~/components/forms/TaskForm.vue'

useHead({ title: 'Новое поручение — Akimat Control' })

const EXAMPLE = 'Необходимо до 20 октября восстановить освещение возле школы №17 на улице Абая.'

const form = ref<TaskFormValue>({
  title: '',
  description: '',
  departmentId: null,
  assigneeId: null,
  deadline: '',
  priority: 'MEDIUM',
})

const aiText = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const aiFilled = ref<Partial<Record<keyof TaskFormValue, boolean>>>({})
const aiMissing = ref<string[]>([])
const aiNotice = ref<string | null>(null)

async function fillWithAi() {
  aiLoading.value = true
  aiError.value = ''
  aiNotice.value = null
  try {
    const draft = await $fetch('/api/ai/task', { method: 'POST', body: { text: aiText.value } })
    form.value.title = draft.title
    form.value.description = draft.description
    form.value.priority = draft.priority
    if (draft.deadline) form.value.deadline = draft.deadline
    if (draft.departmentId) form.value.departmentId = draft.departmentId
    aiNotice.value = draft.notice

    aiFilled.value = { title: true, description: true, priority: true, deadline: !!draft.deadline, departmentId: !!draft.departmentId }
    aiMissing.value = [!draft.deadline && 'срок', !draft.departmentId && 'подразделение'].filter((item): item is string => !!item)
  } catch (error) {
    aiError.value = getErrorMessage(error, 'Не удалось получить ответ AI. Заполните форму вручную.')
  } finally {
    aiLoading.value = false
  }
}

const submitting = ref(false)
const submitError = ref('')

async function submit() {
  submitting.value = true
  submitError.value = ''
  try {
    const created = await $fetch('/api/tasks', { method: 'POST', body: form.value })
    await navigateTo(`/tasks/${created.id}`)
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Не удалось создать поручение')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <NuxtLink to="/tasks" class="text-sm text-muted hover:text-ink">← К списку поручений</NuxtLink>
    <h1 class="page-title mb-6 mt-2">Новое поручение</h1>

    <section class="card mb-5 border-iris/25 bg-lavender/40 p-5">
      <div class="mb-3">
        <h2 class="flex items-center gap-2 text-sm font-semibold text-iris">
          <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" /></svg>
          Создать с помощью AI
        </h2>
        <p class="mt-1 text-sm text-muted">Опишите поручение обычным текстом. AI заполнит форму, а вы проверите данные перед сохранением.</p>
      </div>
      <textarea v-model="aiText" rows="3" class="field-input" :placeholder="EXAMPLE" />
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button type="button" class="text-sm text-iris hover:underline" @click="aiText = EXAMPLE">Подставить пример</button>
        <button type="button" class="btn-ai" :disabled="aiLoading || aiText.trim().length < 10" @click="fillWithAi">
          {{ aiLoading ? 'AI анализирует текст…' : 'Создать с помощью AI' }}
        </button>
      </div>
      <p v-if="aiError" class="alert-error mt-3">{{ aiError }}</p>
      <p v-if="aiNotice" class="mt-3 rounded-lg border border-warn/25 bg-warn-soft px-3 py-2 text-sm text-ink">{{ aiNotice }}</p>
    </section>

    <section class="card p-5">
      <div v-if="Object.keys(aiFilled).length" class="mb-5 rounded-lg border border-iris/25 bg-lavender/60 px-4 py-3 text-sm text-ink">
        <strong>Проверьте данные, предложенные AI.</strong> Поля, заполненные AI, выделены цветом и доступны для редактирования.
        <span v-if="aiMissing.length"> AI не смог определить: {{ aiMissing.join(', ') }} — укажите вручную.</span>
      </div>

      <FormsTaskForm v-model="form" :submitting="submitting" :highlight="aiFilled" @submit="submit" />
      <p v-if="submitError" class="alert-error mt-3">{{ submitError }}</p>
    </section>
  </div>
</template>
