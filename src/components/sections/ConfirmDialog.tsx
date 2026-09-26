import {
    useEffect,
    useRef,
} from 'react';

import '../../styles/confirm-dialog.css'

export type ConfirmDialogVariant =
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    loading?: boolean;
    loadingText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    loading = false,
    loadingText = 'Please wait...',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const cancelButtonRef =
        useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        window.setTimeout(() => {
            cancelButtonRef.current?.focus();
        }, 0);

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === 'Escape' &&
                !loading
            ) {
                onCancel();
            }
        };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [
        open,
        loading,
        onCancel,
    ]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="confirm-dialog-backdrop"
            onMouseDown={event => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onCancel();
                }
            }}
        >
            <div
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <div
                    className={`confirm-dialog-icon ${variant}`}
                    aria-hidden="true"
                >
                    {variant === 'danger'
                        ? '!'
                        : variant === 'warning'
                            ? '!'
                            : variant === 'success'
                                ? '✓'
                                : '?'}
                </div>

                <div className="confirm-dialog-content">
                    <h2 id="confirm-dialog-title">
                        {title}
                    </h2>

                    <p id="confirm-dialog-message">
                        {message}
                    </p>
                </div>

                <div className="confirm-dialog-actions">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="confirm-dialog-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className={`confirm-dialog-confirm ${variant}`}
                        onClick={() => {
                            void onConfirm();
                        }}
                        disabled={loading}
                    >
                        {loading
                            ? loadingText
                            : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
