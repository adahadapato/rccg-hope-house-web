import '../styles/admin-action-buttons.css';

interface AdminActionButtonsProps {
    itemName: string;

    /* Activate / Deactivate */
    isActive?: boolean;
    onToggle?: () => void;

    /* Feature / Unfeature */
    isFeatured?: boolean;
    onFeatureToggle?: () => void;

    /* Pin / Unpin */
    isPinned?: boolean;
    onPinToggle?: () => void;

    /* Public / Private or Publish / Unpublish */
    isPublic?: boolean;
    onVisibilityToggle?: () => void;

    /* Standard actions */
    onEdit?: () => void;
    onDelete?: () => void;

    /* Titles */
    editTitle?: string;

    activateTitle?: string;
    deactivateTitle?: string;

    featureTitle?: string;
    unfeatureTitle?: string;

    pinTitle?: string;
    unpinTitle?: string;

    makePublicTitle?: string;
    makePrivateTitle?: string;

    deleteTitle?: string;

    disabled?: boolean;
}


/* ============================================================
   EDIT
   ============================================================ */

function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="M12 20h9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />

            <path
                d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


/* ============================================================
   ACTIVATE
   ============================================================ */

function ActivateIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="M5 12.5 9.5 17 19 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


/* ============================================================
   DEACTIVATE
   ============================================================ */

function DeactivateIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="M6 6 18 18M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
        </svg>
    );
}


/* ============================================================
   FEATURE
   Outlined star = click to feature
   ============================================================ */

function FeatureIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="
                    M12 2.8
                    14.8 8.5
                    21 9.4
                    16.5 13.8
                    17.6 20
                    12 17.1
                    6.4 20
                    7.5 13.8
                    3 9.4
                    9.2 8.5
                    Z
                "
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


/* ============================================================
   UNFEATURE
   Filled star = currently featured
   ============================================================ */

function UnfeatureIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="
                    M12 2.8
                    14.8 8.5
                    21 9.4
                    16.5 13.8
                    17.6 20
                    12 17.1
                    6.4 20
                    7.5 13.8
                    3 9.4
                    9.2 8.5
                    Z
                "
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


/* ============================================================
   PIN
   Pushpin = click to pin
   ============================================================ */

function PinIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="M9 3h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />

            <path
                d="M10 3v5l-3 4v2h10v-2l-3-4V3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M12 14v7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}


/* ============================================================
   UNPIN
   Filled pushpin = currently pinned
   ============================================================ */

function UnpinIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="M9 3h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />

            <path
                d="M10 3v5l-3 4v2h10v-2l-3-4V3Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M12 14v7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}


/* ============================================================
   MAKE PUBLIC / PUBLISH
   ============================================================ */

function MakePublicIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
            />

            <path
                d="M3 12h18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />

            <path
                d="M12 3c2.5 2.5 4 5.6 4 9s-1.5 6.5-4 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />

            <path
                d="M12 3c-2.5 2.5-4 5.6-4 9s1.5 6.5 4 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}


/* ============================================================
   MAKE PRIVATE / UNPUBLISH
   ============================================================ */

function MakePrivateIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
            />

            <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />

            <circle
                cx="12"
                cy="15"
                r="1.3"
                fill="currentColor"
            />

            <path
                d="M12 16.3V18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}


/* ============================================================
   DELETE
   ============================================================ */

function DeleteIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="admin-action-svg"
        >
            <path
                d="M3 6h18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />

            <path
                d="M8 6V4h8v2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M19 6 18 21H6L5 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M10 11v5M14 11v5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}


/* ============================================================
   ADMIN ACTION BUTTONS
   ============================================================ */

export default function AdminActionButtons({
    itemName,

    isActive,
    onToggle,

    isFeatured,
    onFeatureToggle,

    isPinned,
    onPinToggle,

    isPublic,
    onVisibilityToggle,

    onEdit,
    onDelete,

    editTitle = 'Edit',

    activateTitle = 'Activate',
    deactivateTitle = 'Deactivate',

    featureTitle = 'Feature',
    unfeatureTitle = 'Unfeature',

    pinTitle = 'Pin',
    unpinTitle = 'Unpin',

    makePublicTitle = 'Make public',
    makePrivateTitle = 'Make private',

    deleteTitle = 'Delete',

    disabled = false,
}: AdminActionButtonsProps) {
    return (
        <div className="admin-action-buttons">

            {/* EDIT */}
            {onEdit && (
                <button
                    type="button"
                    className="admin-action-icon"
                    onClick={onEdit}
                    disabled={disabled}
                    aria-label={`${editTitle} ${itemName}`}
                    title={editTitle}
                >
                    <EditIcon />
                </button>
            )}


            {/* ACTIVATE / DEACTIVATE */}
            {onToggle &&
                typeof isActive === 'boolean' && (
                    <button
                        type="button"
                        className={`admin-action-icon ${isActive
                                ? 'admin-action-warning'
                                : 'admin-action-success'
                            }`}
                        onClick={onToggle}
                        disabled={disabled}
                        aria-label={
                            isActive
                                ? `${deactivateTitle} ${itemName}`
                                : `${activateTitle} ${itemName}`
                        }
                        title={
                            isActive
                                ? deactivateTitle
                                : activateTitle
                        }
                    >
                        {isActive ? (
                            <DeactivateIcon />
                        ) : (
                            <ActivateIcon />
                        )}
                    </button>
                )}


            {/* FEATURE / UNFEATURE */}
            {onFeatureToggle &&
                typeof isFeatured === 'boolean' && (
                    <button
                        type="button"
                        className={`admin-action-icon ${isFeatured
                                ? 'admin-action-featured'
                                : 'admin-action-feature'
                            }`}
                        onClick={onFeatureToggle}
                        disabled={disabled}
                        aria-label={
                            isFeatured
                                ? `${unfeatureTitle} ${itemName}`
                                : `${featureTitle} ${itemName}`
                        }
                        title={
                            isFeatured
                                ? unfeatureTitle
                                : featureTitle
                        }
                    >
                        {isFeatured ? (
                            <UnfeatureIcon />
                        ) : (
                            <FeatureIcon />
                        )}
                    </button>
                )}


            {/* PIN / UNPIN */}
            {onPinToggle &&
                typeof isPinned === 'boolean' && (
                    <button
                        type="button"
                        className={`admin-action-icon ${isPinned
                                ? 'admin-action-pinned'
                                : 'admin-action-pin'
                            }`}
                        onClick={onPinToggle}
                        disabled={disabled}
                        aria-label={
                            isPinned
                                ? `${unpinTitle} ${itemName}`
                                : `${pinTitle} ${itemName}`
                        }
                        title={
                            isPinned
                                ? unpinTitle
                                : pinTitle
                        }
                    >
                        {isPinned ? (
                            <UnpinIcon />
                        ) : (
                            <PinIcon />
                        )}
                    </button>
                )}


            {/* PUBLIC / PRIVATE */}
            {onVisibilityToggle &&
                typeof isPublic === 'boolean' && (
                    <button
                        type="button"
                        className={`admin-action-icon ${isPublic
                                ? 'admin-action-private'
                                : 'admin-action-public'
                            }`}
                        onClick={onVisibilityToggle}
                        disabled={disabled}
                        aria-label={
                            isPublic
                                ? `${makePrivateTitle} ${itemName}`
                                : `${makePublicTitle} ${itemName}`
                        }
                        title={
                            isPublic
                                ? makePrivateTitle
                                : makePublicTitle
                        }
                    >
                        {isPublic ? (
                            <MakePrivateIcon />
                        ) : (
                            <MakePublicIcon />
                        )}
                    </button>
                )}


            {/* DELETE */}
            {onDelete && (
                <button
                    type="button"
                    className="admin-action-icon admin-action-danger"
                    onClick={onDelete}
                    disabled={disabled}
                    aria-label={`${deleteTitle} ${itemName}`}
                    title={deleteTitle}
                >
                    <DeleteIcon />
                </button>
            )}

        </div>
    );
}