import { Fragment, useState } from 'react';

// ── Vite proxy: /api          → http://localhost:3001 (supplier-service)
const API = '/api';
// ── Vite proxy: /checklist-api → http://localhost:3000 (checklist-service)
const CHECKLIST_API = '/checklist-api';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface Supplier {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskData {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

interface ChecklistData {
  id: string;
  supplierId?: string;
  title: string;
  description?: string;
  status: string;
  tasks: TaskData[];
  createdAt: string;
  updatedAt: string;
}

type ChecklistState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; data: ChecklistData }
  | { kind: 'not-found' };

type Tab = 'register' | 'list' | 'search';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
  APPROVED:  'bg-green-100  text-green-800  border border-green-300',
  REJECTED:  'bg-red-100    text-red-800    border border-red-300',
  SUSPENDED: 'bg-gray-100   text-gray-600   border border-gray-300',
};

function computeCompletion(tasks: TaskData[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

async function fetchChecklistBySupplierId(supplierId: string): Promise<ChecklistData | null> {
  try {
    const res = await fetch(`${CHECKLIST_API}/checklists?supplierId=${supplierId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { checklists: ChecklistData[] };
    return data.checklists?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

function Btn({
  children, onClick, disabled, variant = 'primary', size = 'md',
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'info'; size?: 'sm' | 'md';
}) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700',
    success:   'bg-green-600  text-white hover:bg-green-700',
    danger:    'bg-red-600    text-white hover:bg-red-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    info:      'bg-blue-600   text-white hover:bg-blue-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const cls = type === 'error'
    ? 'bg-red-50 border border-red-200 text-red-800'
    : 'bg-green-50 border border-green-200 text-green-800';
  return <div className={`rounded-md px-4 py-3 text-sm ${cls}`}>{message}</div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-100 last:border-0">
      <span className="w-32 flex-shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-900 break-all">{value}</span>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-indigo-700 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ChecklistPanel — renders tasks with checkboxes
// ─────────────────────────────────────────────────────────────────
function ChecklistPanel({
  checklist,
  onTaskComplete,
  completingTaskId,
}: {
  checklist: ChecklistData;
  onTaskComplete: (checklistId: string, taskId: string) => void;
  completingTaskId: string | null;
}) {
  const pct = computeCompletion(checklist.tasks);
  const completedCount = checklist.tasks.filter((t) => t.completed).length;

  return (
    <div className="rounded-lg border border-indigo-100 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-indigo-900">{checklist.title}</span>
        <span className="text-xs text-gray-500 tabular-nums">
          {completedCount}/{checklist.tasks.length} tareas
        </span>
      </div>

      <ProgressBar pct={pct} />

      <ul className="space-y-2 pt-1">
        {checklist.tasks.map((task) => {
          const isCompleting = completingTaskId === task.id;
          return (
            <li key={task.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.completed}
                disabled={task.completed || isCompleting}
                onChange={() => onTaskComplete(checklist.id, task.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600
                           focus:ring-indigo-500 disabled:cursor-not-allowed cursor-pointer"
              />
              <span
                className={`text-sm flex-1 ${
                  task.completed ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {isCompleting ? <span className="animate-pulse">Completando…</span> : task.title}
              </span>
              {task.completed && (
                <span className="text-xs text-green-600 font-medium shrink-0">Completada</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab 1 — Registrar Proveedor
// ─────────────────────────────────────────────────────────────────
function RegisterTab() {
  const [form, setForm] = useState({ companyName: '', email: '', phone: '', country: '' });
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checklistState, setChecklistState] = useState<ChecklistState>({ kind: 'idle' });
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const pollChecklist = async (id: string) => {
    setChecklistState({ kind: 'loading' });
    const found = await fetchChecklistBySupplierId(id);
    setChecklistState(found ? { kind: 'found', data: found } : { kind: 'not-found' });
  };

  const handleRegister = async () => {
    setLoading(true);
    setSupplierId(null);
    setError(null);
    setChecklistState({ kind: 'idle' });
    try {
      const res = await fetch(`${API}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al registrar');
      const newId = data.id as string;
      setSupplierId(newId);
      setForm({ companyName: '', email: '', phone: '', country: '' });
      // Wait 1 s for event-driven checklist creation, then check
      setTimeout(() => void pollChecklist(newId), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (checklistId: string, taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      const res = await fetch(
        `${CHECKLIST_API}/checklists/${checklistId}/tasks/${taskId}/complete`,
        { method: 'PATCH' },
      );
      if (!res.ok) return;
      setChecklistState((prev) => {
        if (prev.kind !== 'found') return prev;
        return {
          kind: 'found',
          data: {
            ...prev.data,
            tasks: prev.data.tasks.map((t) =>
              t.id === taskId
                ? { ...t, completed: true, completedAt: new Date().toISOString() }
                : t,
            ),
          },
        };
      });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const isValid = form.companyName && form.email && form.phone && form.country;

  return (
    <div className="max-w-md space-y-4">
      <Field label="Nombre de empresa" value={form.companyName}
             onChange={set('companyName')} placeholder="Acme Corp" />
      <Field label="Email" value={form.email} type="email"
             onChange={set('email')} placeholder="contact@acme.com" />
      <Field label="Teléfono" value={form.phone}
             onChange={set('phone')} placeholder="+15550100" />
      <Field label="País" value={form.country}
             onChange={set('country')} placeholder="US" />

      <Btn onClick={handleRegister} disabled={loading || !isValid}>
        {loading ? 'Registrando…' : 'Registrar'}
      </Btn>

      {/* ── Post-registration checklist feedback ── */}
      {supplierId && checklistState.kind !== 'idle' && (
        <div className="rounded-md border px-4 py-3 space-y-3
                        bg-green-50 border-green-200">
          <p className="text-xs text-green-600 font-medium">Proveedor registrado</p>
          <p className="font-mono text-xs text-green-900 break-all">{supplierId}</p>

          {checklistState.kind === 'loading' && (
            <p className="text-sm text-gray-500 italic animate-pulse">
              Verificando checklist automático…
            </p>
          )}

          {checklistState.kind === 'found' && (
            <>
              <p className="text-sm font-semibold text-green-800">
                ✅ Supplier registrado — Checklist creado automáticamente
              </p>
              <ChecklistPanel
                checklist={checklistState.data}
                onTaskComplete={handleCompleteTask}
                completingTaskId={completingTaskId}
              />
            </>
          )}

          {checklistState.kind === 'not-found' && (
            <div className="space-y-2">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200
                            rounded px-3 py-2">
                Checklist pendiente de creación…
              </p>
              <Btn size="sm" variant="secondary" onClick={() => void pollChecklist(supplierId)}>
                Verificar checklist
              </Btn>
            </div>
          )}
        </div>
      )}

      {error && <Alert type="error" message={error} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab 2 — Lista de Proveedores
// ─────────────────────────────────────────────────────────────────
function ListTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checklistMap, setChecklistMap] = useState<Record<string, ChecklistState>>({});
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(`${API}/suppliers`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar');
      setSuppliers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id + action);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`${API}/suppliers/${id}/${action}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error al ${action}`);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: data.status } : s)),
      );
      setFeedback(`${action === 'approve' ? 'Aprobado' : 'Rechazado'}: ${data.companyName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleChecklist = async (supplierId: string) => {
    if (expandedId === supplierId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(supplierId);
    // Skip fetch if already cached
    if (checklistMap[supplierId]) return;
    setChecklistMap((prev) => ({ ...prev, [supplierId]: { kind: 'loading' } }));
    const found = await fetchChecklistBySupplierId(supplierId);
    setChecklistMap((prev) => ({
      ...prev,
      [supplierId]: found ? { kind: 'found', data: found } : { kind: 'not-found' },
    }));
  };

  const handleCompleteTask = async (
    supplierId: string,
    checklistId: string,
    taskId: string,
  ) => {
    setCompletingTaskId(taskId);
    try {
      const res = await fetch(
        `${CHECKLIST_API}/checklists/${checklistId}/tasks/${taskId}/complete`,
        { method: 'PATCH' },
      );
      if (!res.ok) return;
      setChecklistMap((prev) => {
        const entry = prev[supplierId];
        if (entry?.kind !== 'found') return prev;
        return {
          ...prev,
          [supplierId]: {
            kind: 'found',
            data: {
              ...entry.data,
              tasks: entry.data.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, completed: true, completedAt: new Date().toISOString() }
                  : t,
              ),
            },
          },
        };
      });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const COL_COUNT = 6;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Btn onClick={loadSuppliers} disabled={loading} variant="secondary">
          {loading ? 'Cargando…' : 'Cargar proveedores'}
        </Btn>
        {suppliers.length > 0 && (
          <span className="text-sm text-gray-500">{suppliers.length} proveedor(es)</span>
        )}
      </div>

      {error    && <Alert type="error"   message={error} />}
      {feedback && <Alert type="success" message={feedback} />}

      {suppliers.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Empresa', 'Email', 'País', 'Estado', 'Checklist', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {suppliers.map((s) => {
                const busy = actionLoading?.startsWith(s.id);
                const isExpanded = expandedId === s.id;
                const clState = checklistMap[s.id];

                return (
                  <Fragment key={s.id}>
                    {/* ── Supplier row ── */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.companyName}</td>
                      <td className="px-4 py-3 text-gray-600">{s.email}</td>
                      <td className="px-4 py-3 text-gray-600">{s.country}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Btn
                          size="sm"
                          variant={isExpanded ? 'secondary' : 'info'}
                          onClick={() => void toggleChecklist(s.id)}
                        >
                          {isExpanded ? 'Cerrar' : 'Ver Checklist'}
                        </Btn>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Btn
                            size="sm" variant="success"
                            disabled={!!busy || s.status !== 'PENDING'}
                            onClick={() => updateStatus(s.id, 'approve')}
                          >
                            {actionLoading === s.id + 'approve' ? '…' : 'Aprobar'}
                          </Btn>
                          <Btn
                            size="sm" variant="danger"
                            disabled={!!busy || s.status === 'REJECTED'}
                            onClick={() => updateStatus(s.id, 'reject')}
                          >
                            {actionLoading === s.id + 'reject' ? '…' : 'Rechazar'}
                          </Btn>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expandable checklist row ── */}
                    {isExpanded && (
                      <tr className="border-b border-indigo-100 bg-indigo-50/30">
                        <td colSpan={COL_COUNT} className="px-6 py-4">
                          {(!clState || clState.kind === 'loading') && (
                            <p className="text-sm text-gray-400 italic animate-pulse">
                              Cargando checklist…
                            </p>
                          )}
                          {clState?.kind === 'not-found' && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200
                                          rounded-md px-3 py-2">
                              Checklist pendiente de creación…
                            </p>
                          )}
                          {clState?.kind === 'found' && (
                            <ChecklistPanel
                              checklist={clState.data}
                              onTaskComplete={(checklistId, taskId) =>
                                void handleCompleteTask(s.id, checklistId, taskId)
                              }
                              completingTaskId={completingTaskId}
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && suppliers.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Haz clic en "Cargar proveedores" para ver la lista.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab 3 — Buscar Proveedor
// ─────────────────────────────────────────────────────────────────
function SearchTab() {
  const [supplierId, setSupplierId] = useState('');
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!supplierId.trim()) return;
    setLoading(true);
    setSupplier(null);
    setError(null);
    try {
      const res = await fetch(`${API}/suppliers/${supplierId.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No encontrado');
      setSupplier(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex gap-2">
        <input
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm
                     focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <Btn onClick={handleSearch} disabled={loading || !supplierId.trim()}>
          {loading ? 'Buscando…' : 'Buscar'}
        </Btn>
      </div>

      {error && <Alert type="error" message={error} />}

      {supplier && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-800">{supplier.companyName}</span>
            <StatusBadge status={supplier.status} />
          </div>
          <div className="px-4 py-3 space-y-0.5">
            <DetailRow label="ID"          value={supplier.id} />
            <DetailRow label="Email"       value={supplier.email} />
            <DetailRow label="Teléfono"    value={supplier.phone} />
            <DetailRow label="País"        value={supplier.country} />
            <DetailRow label="Estado"      value={supplier.status} />
            <DetailRow label="Registrado"  value={new Date(supplier.createdAt).toLocaleString('es')} />
            <DetailRow label="Actualizado" value={new Date(supplier.updatedAt).toLocaleString('es')} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'register', label: 'Registrar Proveedor' },
  { id: 'list',     label: 'Lista de Proveedores' },
  { id: 'search',   label: 'Buscar Proveedor' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('register');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Supplier Onboarding</h1>
            <p className="text-xs text-gray-400">supplier-service :3001 · checklist-service :3000</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-white border border-gray-200 p-1 mb-6 w-fit shadow-sm">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors
                ${tab === id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
          {tab === 'register' && <RegisterTab />}
          {tab === 'list'     && <ListTab />}
          {tab === 'search'   && <SearchTab />}
        </div>
      </main>
    </div>
  );
}
