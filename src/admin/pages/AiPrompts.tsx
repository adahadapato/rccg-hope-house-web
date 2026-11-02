import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    apiFetch,
    getApiErrorDetails,
    getNetworkErrorDetails,
    type ApiErrorDetails,
} from '@/api/api';

import ApiErrorState from '@/components/sections/ApiErrorState';
import ConfirmDialog from '@/components/sections/ConfirmDialog';

import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/ai-prompts.css';

/* ============================================================
   TYPES
   ============================================================ */

interface AiPromptSummary {
    key: string;
    name: string;
    description: string;
    isCustomised: boolean;
    currentVersion: number | null;
    updatedAt: string | null;
    updatedBy: string | null;
}

interface AiPromptVersion {
    id: string;
    version: number;
    instructions: string;
    changeNote: string | null;
    changedBy: string | null;
    isActive: boolean;
    createdAt: string;
}

interface AiPromptDetail {
    key: string;
    name: string;
    description: string;
    inputDescription: string;
    requiredTerms: string[];
    instructions: string;
    defaultInstructions: string;
    isCustomised: boolean;
    currentVersion: number | null;
    missingTerms: string[];
    history: AiPromptVersion[];
}

interface AiPromptSuggestion {
    suggestedInstructions: string;
    summary: string;
    missingTerms: string[];
}

type PendingConfirm =
    | { kind: 'save-missing'; missing: string[] }
    | { kind: 'reset' }
    | { kind: 'restore'; version: AiPromptVersion }
    | { kind: 'switch'; key: string }
    | null;

const MAX_PROMPT_LENGTH = 20000;

const SUGGESTION_IDEAS = [
    'Make it shorter and clearer without losing any rules',
    'Use British English spelling throughout',
    'Be more lenient: only block clearly unacceptable content',
    'Make the tone warmer and more pastoral',
];

/* ============================================================
   HELPERS
   ============================================================ */

function formatDateTime(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function findMissingTerms(text: string, terms: string[]): string[] {
    const lower = text.toLowerCase();
    return terms.filter(term => !lower.includes(term.toLowerCase()));
}

function errorMessage(error: unknown, fallback: string): string {
    if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        return (error as { message: string }).message;
    }

    return fallback;
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
    if (!response.ok) {
        throw await getApiErrorDetails(response, fallback);
    }

    return (await response.json()) as T;
}

/* ============================================================
   PAGE
   ============================================================ */

function AiPrompts() {
    const [prompts, setPrompts] = useState<AiPromptSummary[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState<ApiErrorDetails | null>(null);
    const [listReloadKey, setListReloadKey] = useState(0);

    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [detail, setDetail] = useState<AiPromptDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [draft, setDraft] = useState('');
    const [changeNote, setChangeNote] = useState('');
    const [saving, setSaving] = useState(false);

    const [requestedChange, setRequestedChange] = useState('');
    const [suggesting, setSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<AiPromptSuggestion | null>(null);

    const [openVersionId, setOpenVersionId] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<PendingConfirm>(null);

    const [actionError, setActionError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    /* ========== LOAD LIST ========== */

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                const response = await apiFetch('/api/ai-prompts', {
                    signal: controller.signal,
                });

                const list = await readJson<AiPromptSummary[]>(
                    response,
                    'AI prompts could not be loaded.'
                );

                if (controller.signal.aborted) {
                    return;
                }

                setPrompts(list);
                setListError(null);
                setSelectedKey(current => current ?? list[0]?.key ?? null);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                setListError(
                    error && typeof error === 'object' && 'message' in error
                        ? (error as ApiErrorDetails)
                        : getNetworkErrorDetails(error)
                );
            } finally {
                if (!controller.signal.aborted) {
                    setListLoading(false);
                }
            }
        };

        void load();

        return () => controller.abort();
    }, [listReloadKey]);

    /* ========== LOAD SELECTED PROMPT ========== */

    const applyDetail = useCallback((next: AiPromptDetail) => {
        setDetail(next);
        setDraft(next.instructions);
        setChangeNote('');
        setSuggestion(null);
        setOpenVersionId(null);
    }, []);

    useEffect(() => {
        if (!selectedKey) {
            return;
        }

        const controller = new AbortController();

        const load = async () => {
            try {
                const response = await apiFetch(
                    `/api/ai-prompts/${encodeURIComponent(selectedKey)}`,
                    { signal: controller.signal }
                );

                const next = await readJson<AiPromptDetail>(
                    response,
                    'This prompt could not be loaded.'
                );

                if (!controller.signal.aborted) {
                    applyDetail(next);
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                setActionError(errorMessage(error, 'This prompt could not be loaded.'));
            } finally {
                if (!controller.signal.aborted) {
                    setDetailLoading(false);
                }
            }
        };

        void load();

        return () => controller.abort();
    }, [selectedKey, applyDetail]);

    /* ========== DERIVED ========== */

    const isDirty = detail !== null && draft.trim() !== detail.instructions.trim();

    const missingTerms = useMemo(
        () => (detail ? findMissingTerms(draft, detail.requiredTerms) : []),
        [detail, draft]
    );

    /* ========== ACTIONS ========== */

    const afterChange = (next: AiPromptDetail, message: string) => {
        applyDetail(next);
        setSuccessMessage(message);
        setListReloadKey(key => key + 1);
    };

    const selectPrompt = (key: string) => {
        if (key === selectedKey) {
            return;
        }

        if (isDirty) {
            setConfirm({ kind: 'switch', key });
            return;
        }

        switchTo(key);
    };

    const switchTo = (key: string) => {
        setActionError(null);
        setSuccessMessage(null);
        setDetailLoading(true);
        setSelectedKey(key);
    };

    const save = async () => {
        if (!detail) {
            return;
        }

        setSaving(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            const response = await apiFetch(
                `/api/ai-prompts/${encodeURIComponent(detail.key)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instructions: draft,
                        changeNote: changeNote.trim() || null,
                    }),
                }
            );

            const next = await readJson<AiPromptDetail>(response, 'The prompt could not be saved.');

            afterChange(
                next,
                `Saved as version ${next.currentVersion}. The AI uses it from now on.`
            );
        } catch (error) {
            setActionError(errorMessage(error, 'The prompt could not be saved.'));
        } finally {
            setSaving(false);
        }
    };

    const requestSave = () => {
        if (missingTerms.length > 0) {
            setConfirm({ kind: 'save-missing', missing: missingTerms });
            return;
        }

        void save();
    };

    const postAction = async (path: string, message: string) => {
        if (!detail) {
            return;
        }

        setSaving(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            const response = await apiFetch(path, { method: 'POST' });
            const next = await readJson<AiPromptDetail>(response, 'The change could not be saved.');
            afterChange(next, message);
        } catch (error) {
            setActionError(errorMessage(error, 'The change could not be saved.'));
        } finally {
            setSaving(false);
        }
    };

    const suggest = async () => {
        if (!detail || !requestedChange.trim()) {
            return;
        }

        setSuggesting(true);
        setActionError(null);
        setSuggestion(null);

        try {
            const response = await apiFetch(
                `/api/ai-prompts/${encodeURIComponent(detail.key)}/suggest`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentInstructions: draft,
                        requestedChange: requestedChange.trim(),
                    }),
                }
            );

            if (response.status === 429) {
                throw {
                    message: 'You have asked for many suggestions in a short time. Please wait a few minutes.',
                };
            }

            setSuggestion(
                await readJson<AiPromptSuggestion>(response, 'The AI could not suggest a change.')
            );
        } catch (error) {
            setActionError(errorMessage(error, 'The AI could not suggest a change.'));
        } finally {
            setSuggesting(false);
        }
    };

    const useSuggestion = () => {
        if (!suggestion) {
            return;
        }

        setDraft(suggestion.suggestedInstructions);

        if (!changeNote.trim()) {
            setChangeNote(`AI: ${requestedChange.trim()}`.slice(0, 300));
        }

        setSuggestion(null);
        setSuccessMessage('Suggestion copied into the editor. Review it, then press Save to use it.');
    };

    const runConfirmed = () => {
        const pending = confirm;
        setConfirm(null);

        if (!pending || !detail) {
            return;
        }

        switch (pending.kind) {
            case 'save-missing':
                void save();
                break;
            case 'reset':
                void postAction(
                    `/api/ai-prompts/${encodeURIComponent(detail.key)}/reset`,
                    'Back to the built-in default. The AI uses it from now on.'
                );
                break;
            case 'restore':
                void postAction(
                    `/api/ai-prompts/${encodeURIComponent(detail.key)}/restore/${pending.version.id}`,
                    `Version ${pending.version.version} restored. The AI uses it from now on.`
                );
                break;
            case 'switch':
                switchTo(pending.key);
                break;
        }
    };

    const confirmText = (() => {
        switch (confirm?.kind) {
            case 'save-missing':
                return {
                    title: 'Some answer-format terms are missing',
                    message: `The code reads these from the AI's answer: ${confirm.missing.join(', ')}. Without them this feature may stop working. Save anyway?`,
                    button: 'Save anyway',
                    variant: 'warning' as const,
                };
            case 'reset':
                return {
                    title: 'Reset to built-in default',
                    message: 'The AI will go back to the original prompt. Your current version stays in the history, so you can restore it later.',
                    button: 'Reset',
                    variant: 'warning' as const,
                };
            case 'restore':
                return {
                    title: `Restore version ${confirm.version.version}`,
                    message: 'This version becomes the one the AI uses, saved as a new version. Nothing is deleted.',
                    button: 'Restore',
                    variant: 'primary' as const,
                };
            case 'switch':
                return {
                    title: 'Discard unsaved changes?',
                    message: 'You have edited this prompt without saving. Switching prompts will lose those changes.',
                    button: 'Discard changes',
                    variant: 'danger' as const,
                };
            default:
                return { title: '', message: '', button: 'Confirm', variant: 'primary' as const };
        }
    })();

    /* ========== RENDER ========== */

    return (
        <AdminLayout>
            <section className="prompts-admin-page">
                <div className="prompts-admin-header">
                    <span className="admin-eyebrow">AI</span>
                    <h1>AI Prompts</h1>
                    <p>
                        The instructions behind every AI feature on the website. Edit them yourself
                        or ask the AI to improve them. Saved changes are used straight away, and every
                        version is kept so you can restore it.
                    </p>
                </div>

                {actionError && (
                    <div className="admin-message admin-message-error" role="alert">
                        <div>
                            <strong>Something went wrong</strong>
                            <p>{actionError}</p>
                        </div>
                        <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error">
                            ×
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="admin-message admin-message-success" role="status">
                        {successMessage}
                    </div>
                )}

                {listLoading ? (
                    <div className="admin-empty-state">
                        <div className="admin-loading-spinner" />
                        <p>Loading AI prompts...</p>
                    </div>
                ) : listError ? (
                    <ApiErrorState
                        status={listError.status}
                        title={listError.title}
                        message={listError.message}
                        onRetry={() => {
                            setListLoading(true);
                            setListReloadKey(key => key + 1);
                            return true;
                        }}
                    />
                ) : (
                    <div className="prompts-layout">
                        {/* ===== LIST ===== */}
                        <nav className="prompts-list" aria-label="AI prompts">
                            {prompts.map(prompt => (
                                <button
                                    key={prompt.key}
                                    type="button"
                                    className={`prompts-list-item ${prompt.key === selectedKey ? 'active' : ''}`}
                                    onClick={() => selectPrompt(prompt.key)}
                                    aria-current={prompt.key === selectedKey ? 'true' : undefined}
                                >
                                    <span className="prompts-list-name">{prompt.name}</span>
                                    <span className="prompts-list-description">{prompt.description}</span>
                                    <span className={`prompts-badge ${prompt.isCustomised ? 'custom' : ''}`}>
                                        {prompt.isCustomised
                                            ? `Custom · v${prompt.currentVersion}`
                                            : 'Built-in default'}
                                    </span>
                                </button>
                            ))}
                        </nav>

                        {/* ===== EDITOR ===== */}
                        <div className="prompts-editor">
                            {detailLoading || !detail ? (
                                <div className="admin-panel admin-empty-state">
                                    <div className="admin-loading-spinner" />
                                    <p>Loading prompt...</p>
                                </div>
                            ) : (
                                <>
                                    <article className="admin-panel prompts-panel">
                                        <div className="prompts-panel-heading">
                                            <div>
                                                <h2>{detail.name}</h2>
                                                <p>{detail.description}</p>
                                            </div>

                                            <span className={`prompts-badge ${detail.isCustomised ? 'custom' : ''}`}>
                                                {detail.isCustomised
                                                    ? `Custom · v${detail.currentVersion}`
                                                    : 'Built-in default'}
                                            </span>
                                        </div>

                                        <div className="prompts-info">
                                            <strong>What the AI receives with this prompt</strong>
                                            <p>{detail.inputDescription}</p>
                                        </div>

                                        <div className="prompts-terms">
                                            <strong>Answer format the code reads</strong>
                                            <div>
                                                {detail.requiredTerms.map(term => {
                                                    const missing = missingTerms.includes(term);

                                                    return (
                                                        <span
                                                            key={term}
                                                            className={`prompts-term ${missing ? 'missing' : ''}`}
                                                            title={missing
                                                                ? 'Not in the prompt: the feature may break'
                                                                : 'In the prompt'}
                                                        >
                                                            {missing ? '✗' : '✓'} {term}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <label className="prompts-editor-label" htmlFor="prompt-text">
                                            Prompt
                                            <small className={draft.length > MAX_PROMPT_LENGTH ? 'over' : undefined}>
                                                {draft.length.toLocaleString('en-GB')} / {MAX_PROMPT_LENGTH.toLocaleString('en-GB')}
                                            </small>
                                        </label>

                                        <textarea
                                            id="prompt-text"
                                            className="prompts-textarea"
                                            value={draft}
                                            onChange={event => setDraft(event.target.value)}
                                            spellCheck
                                            rows={22}
                                        />

                                        <label className="prompts-editor-label" htmlFor="prompt-note">
                                            Change note <small>optional</small>
                                        </label>

                                        <input
                                            id="prompt-note"
                                            className="prompts-input"
                                            value={changeNote}
                                            maxLength={300}
                                            placeholder="e.g. Allow very short wishes like 'HBD'"
                                            onChange={event => setChangeNote(event.target.value)}
                                        />

                                        <div className="prompts-actions">
                                            <button
                                                type="button"
                                                className="admin-primary-button"
                                                onClick={requestSave}
                                                disabled={!isDirty || saving || !draft.trim() || draft.length > MAX_PROMPT_LENGTH}
                                            >
                                                {saving ? 'Saving...' : 'Save and use'}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-secondary-button"
                                                onClick={() => {
                                                    setDraft(detail.instructions);
                                                    setChangeNote('');
                                                }}
                                                disabled={!isDirty || saving}
                                            >
                                                Discard changes
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-secondary-button prompts-reset"
                                                onClick={() => setConfirm({ kind: 'reset' })}
                                                disabled={!detail.isCustomised || saving}
                                                title={detail.isCustomised ? undefined : 'Already using the built-in default'}
                                            >
                                                Reset to default
                                            </button>
                                        </div>
                                    </article>

                                    {/* ===== ASK AI ===== */}
                                    <article className="admin-panel prompts-panel prompts-assistant">
                                        <h3>✨ Ask AI to improve this prompt</h3>
                                        <p className="prompts-muted">
                                            Describe what you want changed. The AI rewrites the prompt in the editor
                                            above and keeps the answer format. Nothing is saved until you press Save.
                                        </p>

                                        <div className="prompts-ideas">
                                            {SUGGESTION_IDEAS.map(idea => (
                                                <button
                                                    key={idea}
                                                    type="button"
                                                    onClick={() => setRequestedChange(idea)}
                                                >
                                                    {idea}
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            className="prompts-input prompts-request"
                                            value={requestedChange}
                                            maxLength={1000}
                                            rows={3}
                                            placeholder="e.g. Approve wishes written in Yoruba or Pidgin, and never hold a wish just for being short."
                                            onChange={event => setRequestedChange(event.target.value)}
                                        />

                                        <div className="prompts-actions">
                                            <button
                                                type="button"
                                                className="admin-primary-button"
                                                onClick={() => void suggest()}
                                                disabled={suggesting || !requestedChange.trim()}
                                            >
                                                {suggesting ? 'Thinking...' : 'Suggest a rewrite'}
                                            </button>
                                        </div>

                                        {suggestion && (
                                            <div className="prompts-suggestion">
                                                <strong>What the AI changed</strong>
                                                <p>{suggestion.summary}</p>

                                                {suggestion.missingTerms.length > 0 && (
                                                    <p className="prompts-warning">
                                                        ⚠ The suggestion is missing: {suggestion.missingTerms.join(', ')}.
                                                        Check it carefully or ask again.
                                                    </p>
                                                )}

                                                <pre>{suggestion.suggestedInstructions}</pre>

                                                <div className="prompts-actions">
                                                    <button
                                                        type="button"
                                                        className="admin-primary-button"
                                                        onClick={useSuggestion}
                                                    >
                                                        Put in editor
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-secondary-button"
                                                        onClick={() => setSuggestion(null)}
                                                    >
                                                        Discard
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </article>

                                    {/* ===== HISTORY ===== */}
                                    <article className="admin-panel prompts-panel">
                                        <h3>History</h3>

                                        {detail.history.length === 0 ? (
                                            <p className="prompts-muted">
                                                No saved versions yet: the AI is using the built-in default.
                                            </p>
                                        ) : (
                                            <ul className="prompts-history">
                                                {detail.history.map(version => (
                                                    <li key={version.id} className={version.isActive ? 'active' : undefined}>
                                                        <div className="prompts-history-row">
                                                            <div>
                                                                <strong>Version {version.version}</strong>
                                                                {version.isActive && (
                                                                    <span className="prompts-badge custom">In use</span>
                                                                )}
                                                                <span className="prompts-muted">
                                                                    {formatDateTime(version.createdAt)}
                                                                    {version.changedBy ? ` · ${version.changedBy}` : ''}
                                                                </span>
                                                                {version.changeNote && (
                                                                    <p>{version.changeNote}</p>
                                                                )}
                                                            </div>

                                                            <div className="prompts-history-actions">
                                                                <button
                                                                    type="button"
                                                                    className="admin-secondary-button"
                                                                    onClick={() =>
                                                                        setOpenVersionId(current =>
                                                                            current === version.id ? null : version.id)
                                                                    }
                                                                >
                                                                    {openVersionId === version.id ? 'Hide' : 'View'}
                                                                </button>

                                                                {!version.isActive && (
                                                                    <button
                                                                        type="button"
                                                                        className="admin-secondary-button"
                                                                        onClick={() => setConfirm({ kind: 'restore', version })}
                                                                        disabled={saving}
                                                                    >
                                                                        Restore
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {openVersionId === version.id && (
                                                            <pre>{version.instructions}</pre>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </article>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    open={confirm !== null}
                    title={confirmText.title}
                    message={confirmText.message}
                    confirmText={confirmText.button}
                    variant={confirmText.variant}
                    onConfirm={runConfirmed}
                    onCancel={() => setConfirm(null)}
                />
            </section>
        </AdminLayout>
    );
}

export default AiPrompts;
