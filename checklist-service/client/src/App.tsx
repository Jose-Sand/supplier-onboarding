import { useState } from 'react'
import './index.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskInput {
  id: string
  title: string
  required: boolean
}

interface TaskProgress {
  id: string
  title: string
  description?: string
  completed: boolean
  completedAt?: string
}

interface ChecklistProgress {
  id: string
  title: string
  description?: string
  status: string
  completionPercentage: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  tasks: TaskProgress[]
  createdAt: string
  updatedAt: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API = '/checklists'

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

async function apiPatch(path: string) {
  const res = await fetch(path, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

async function apiGet(path: string) {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
      />
    </label>
  )
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  size = 'md',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg font-medium transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
  const sz = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'
  const v = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    ghost: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
    danger: 'text-red-500 hover:bg-red-50',
  }[variant]
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${sz} ${v}`}>
      {children}
    </button>
  )
}

function Alert({ message, type }: { message: string; type: 'error' | 'success' }) {
  const color =
    type === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-green-50 border-green-200 text-green-700'
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${color}`}>{message}</div>
  )
}

// ─── Tab 1: Create Checklist ──────────────────────────────────────────────────

function CreateChecklistTab() {
  const [supplierId, setSupplierId] = useState('')
  const [title, setTitle] = useState('')
  const [tasks, setTasks] = useState<TaskInput[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const addTask = () =>
    setTasks((prev) => [...prev, { id: uid(), title: '', required: false }])

  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))

  const updateTask = (id: string, patch: Partial<TaskInput>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const handleSubmit = async () => {
    setError(null)
    setCreatedId(null)
    if (!title.trim()) {
      setError('El título del checklist es requerido.')
      return
    }

    setLoading(true)
    try {
      const body = {
        title: title.trim(),
        description: supplierId ? `supplierId:${supplierId.trim()}` : undefined,
        tasks: tasks
          .filter((t) => t.title.trim())
          .map((t) => ({ title: t.title.trim() })),
      }
      const res = await apiPost(API, body)
      setCreatedId(res.id)
      setTitle('')
      setSupplierId('')
      setTasks([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Supplier ID"
          value={supplierId}
          onChange={setSupplierId}
          placeholder="ej. supplier-123"
        />
        <Input
          label="Título del checklist *"
          value={title}
          onChange={setTitle}
          placeholder="ej. Auditoría Q1 2025"
        />
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Tasks ({tasks.length})
          </span>
          <Btn variant="ghost" size="sm" onClick={addTask}>
            <span>＋</span> Agregar task
          </Btn>
        </div>

        {tasks.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
            Sin tasks — el checklist empezará vacío
          </p>
        )}

        {tasks.map((task, i) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <span className="text-xs text-slate-400 w-5 text-center">{i + 1}</span>
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              placeholder="Título de la task..."
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={task.required}
                onChange={(e) => updateTask(task.id, { required: e.target.checked })}
                className="accent-indigo-600"
              />
              Requerida
            </label>
            <button
              onClick={() => removeTask(task.id)}
              className="text-slate-300 hover:text-red-400 transition text-sm leading-none cursor-pointer"
              title="Eliminar task"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {error && <Alert message={error} type="error" />}

      {createdId && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">
            Checklist creado
          </p>
          <code className="text-sm text-indigo-700 font-mono break-all">{createdId}</code>
          <p className="text-xs text-indigo-400 mt-1">
            Copia este ID y úsalo en la pestaña "Ver Progreso"
          </p>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creando…' : 'Crear Checklist'}
        </Btn>
      </div>
    </div>
  )
}

// ─── Tab 2: Progress ──────────────────────────────────────────────────────────

function ProgressTab() {
  const [checklistId, setChecklistId] = useState('')
  const [progress, setProgress] = useState<ChecklistProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchProgress = async (id = checklistId) => {
    if (!id.trim()) {
      setError('Ingresa un Checklist ID')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet(`${API}/${id.trim()}/progress`)
      setProgress(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    if (!progress) return
    setCompleting(taskId)
    try {
      await apiPatch(`${API}/${progress.id}/tasks/${taskId}/complete`)
      await fetchProgress(progress.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al completar task')
    } finally {
      setCompleting(null)
    }
  }

  const pct = progress?.completionPercentage ?? 0

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Checklist ID"
            value={checklistId}
            onChange={setChecklistId}
            placeholder="ej. 3f4a8b2c-..."
          />
        </div>
        <Btn variant="primary" onClick={() => fetchProgress()} disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar'}
        </Btn>
      </div>

      {error && <Alert message={error} type="error" />}

      {/* Result */}
      {progress && (
        <div className="flex flex-col gap-4">
          {/* Header card */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 leading-tight">
                  {progress.title}
                </h2>
                {progress.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{progress.description}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[progress.status] ?? 'bg-slate-100 text-slate-500'}`}
              >
                {progress.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? '#22c55e' : pct > 0 ? '#6366f1' : '#e2e8f0',
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 w-10 text-right">
                {pct}%
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span>
                <span className="font-semibold text-slate-700">{progress.completedTasks}</span>{' '}
                completadas
              </span>
              <span>
                <span className="font-semibold text-slate-700">{progress.pendingTasks}</span>{' '}
                pendientes
              </span>
              <span>
                <span className="font-semibold text-slate-700">{progress.totalTasks}</span> total
              </span>
            </div>
          </div>

          {/* Tasks list */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tasks
            </span>

            {progress.tasks.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
                Este checklist no tiene tasks
              </p>
            )}

            {progress.tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                  task.completed
                    ? 'border-green-100 bg-green-50'
                    : 'border-slate-100 bg-white hover:border-indigo-200'
                }`}
              >
                {/* Custom checkbox */}
                <button
                  disabled={task.completed || completing === task.id}
                  onClick={() => handleCompleteTask(task.id)}
                  className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition cursor-pointer disabled:cursor-default ${
                    task.completed
                      ? 'border-green-400 bg-green-400'
                      : completing === task.id
                      ? 'border-indigo-300 bg-indigo-100 animate-pulse'
                      : 'border-slate-300 hover:border-indigo-400'
                  }`}
                  title={task.completed ? 'Completada' : 'Marcar como completada'}
                >
                  {task.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <span
                  className={`flex-1 text-sm ${
                    task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {task.title}
                </span>

                {task.completed && task.completedAt && (
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {new Date(task.completedAt).toLocaleString('es-CO', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                )}

                {!task.completed && (
                  <span className="text-xs text-slate-300">pendiente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type Tab = 'create' | 'progress'

export default function App() {
  const [tab, setTab] = useState<Tab>('create')

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Checklist Service
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Prueba la API en{' '}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              localhost:3000
            </code>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          {(
            [
              ['create', 'Crear Checklist'],
              ['progress', 'Ver Progreso'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                tab === id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {tab === 'create' ? <CreateChecklistTab /> : <ProgressTab />}
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          checklist-service · hexagonal architecture + DDD
        </p>
      </div>
    </div>
  )
}
