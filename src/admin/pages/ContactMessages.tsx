import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
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
import AdminActionButtons from '../components/AdminActionButtons';

import '../styles/admin.css';
import '../styles/contact-messages.css';


/* ============================================================
   TYPES
   ============================================================ */

type ContactStatus =
    | 'unread'
    | 'read'
    | 'replied';

type ContactFilter =
    | 'all'
    | ContactStatus;

type ContactReasonValue =
    | number
    | string;

interface ContactMessage {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    reason: ContactReasonValue;
    message: string;
    isRead: boolean;
    respondedAt: string | null;
    createdAt: string;
}

interface ReplyFormState {
    subject: string;
    body: string;
}


/* ============================================================
   CONSTANTS
   ============================================================ */

const emptyReplyForm: ReplyFormState = {
    subject: '',
    body: '',
};


/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Converts the ContactReason value returned by the API into
 * a user-friendly label.
 *
 * The helper supports both numeric enum serialization and
 * string enum serialization.
 */
function contactReasonName(
    reason: ContactReasonValue
) {
    if (
        reason === 1 ||
        reason === '1' ||
        reason === 'Membership'
    ) {
        return 'Membership';
    }

    if (
        reason === 2 ||
        reason === '2' ||
        reason === 'PrayerRequest'
    ) {
        return 'Prayer Request';
    }

    if (
        reason === 3 ||
        reason === '3' ||
        reason === 'Other'
    ) {
        return 'Other';
    }

    return String(reason);
}


/**
 * Determines the administrative status of a Contact Us
 * submission from its existing domain fields.
 */
function contactStatus(
    contact: ContactMessage
): ContactStatus {
    if (contact.respondedAt) {
        return 'replied';
    }

    if (contact.isRead) {
        return 'read';
    }

    return 'unread';
}


/**
 * Returns the display label for a Contact Us status.
 */
function contactStatusLabel(
    contact: ContactMessage
) {
    const status =
        contactStatus(contact);

    if (status === 'replied') {
        return 'Replied';
    }

    if (status === 'read') {
        return 'Read';
    }

    return 'Unread';
}


/**
 * Formats an API date for display in the admin interface.
 */
function formatDateTime(
    value: string
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
    ).format(date);
}


/**
 * Produces a compact table preview without modifying the
 * original message shown in the View modal.
 */
function messagePreview(
    message: string,
    maximumLength = 90
) {
    const normalised =
        message
            .replace(/\s+/g, ' ')
            .trim();

    if (
        normalised.length <=
        maximumLength
    ) {
        return normalised;
    }

    return `${normalised.slice(
        0,
        maximumLength
    ).trim()}…`;
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function ContactMessages() {
    const [
        contacts,
        setContacts,
    ] = useState<ContactMessage[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        retrying,
        setRetrying,
    ] = useState(false);

    const [
        loadError,
        setLoadError,
    ] = useState<ApiErrorDetails | null>(
        null
    );

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(
        null
    );

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(
        null
    );

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        filter,
        setFilter,
    ] = useState<ContactFilter>(
        'all'
    );

    const [
        selectedContact,
        setSelectedContact,
    ] = useState<ContactMessage | null>(
        null
    );

    const [
        viewOpen,
        setViewOpen,
    ] = useState(false);

    const [
        replyContact,
        setReplyContact,
    ] = useState<ContactMessage | null>(
        null
    );

    const [
        replyOpen,
        setReplyOpen,
    ] = useState(false);

    const [
        replyForm,
        setReplyForm,
    ] = useState<ReplyFormState>(
        emptyReplyForm
    );

    const [
        sendingReply,
        setSendingReply,
    ] = useState(false);

    const [
        markingReadId,
        setMarkingReadId,
    ] = useState<string | null>(
        null
    );

    const [
        deleteContact,
        setDeleteContact,
    ] = useState<ContactMessage | null>(
        null
    );

    const [
        deletingId,
        setDeletingId,
    ] = useState<string | null>(
        null
    );


    /* ========================================================
       SUMMARY
       ======================================================== */

    const unreadCount =
        useMemo(
            () =>
                contacts.filter(
                    contact =>
                        contactStatus(
                            contact
                        ) === 'unread'
                ).length,
            [contacts]
        );

    const readCount =
        useMemo(
            () =>
                contacts.filter(
                    contact =>
                        contactStatus(
                            contact
                        ) === 'read'
                ).length,
            [contacts]
        );

    const repliedCount =
        useMemo(
            () =>
                contacts.filter(
                    contact =>
                        contactStatus(
                            contact
                        ) === 'replied'
                ).length,
            [contacts]
        );


    /* ========================================================
       FILTERING
       ======================================================== */

    const filteredContacts =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return contacts.filter(
                contact => {
                    const status =
                        contactStatus(
                            contact
                        );

                    if (
                        filter !== 'all' &&
                        status !== filter
                    ) {
                        return false;
                    }

                    if (!query) {
                        return true;
                    }

                    const searchable =
                        [
                            contact.firstName,
                            contact.lastName,
                            contact.email,
                            contact.phoneNumber ??
                            '',
                            contact.message,
                            contactReasonName(
                                contact.reason
                            ),
                            contactStatusLabel(
                                contact
                            ),
                        ]
                            .join(' ')
                            .toLowerCase();

                    return searchable.includes(
                        query
                    );
                }
            );
        }, [
            contacts,
            filter,
            search,
        ]);


    /* ========================================================
       DATA LOADING
       ======================================================== */

    const fetchContacts =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                /*
                 * The backend query handler limits a single
                 * request to 100 records.
                 */
                const response =
                    await apiFetch(
                        '/api/contact/admin/?unreadOnly=false&skip=0&take=100',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load contact messages.'
                    );
                }

                return (
                    await response.json()
                ) as ContactMessage[];
            },
            []
        );


    const loadContacts =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const data =
                    await fetchContacts(
                        signal
                    );

                setContacts(
                    [...data].sort(
                        (a, b) =>
                            new Date(
                                b.createdAt
                            ).getTime() -
                            new Date(
                                a.createdAt
                            ).getTime()
                    )
                );

                setLoadError(null);
            },
            [fetchContacts]
        );


    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

                    await loadContacts(
                        controller.signal
                    );
                } catch (error) {
                    if (
                        controller.signal
                            .aborted
                    ) {
                        return;
                    }

                    if (
                        typeof error ===
                        'object' &&
                        error !== null &&
                        'message' in error
                    ) {
                        setLoadError(
                            error as ApiErrorDetails
                        );
                    } else {
                        setLoadError(
                            getNetworkErrorDetails()
                        );
                    }
                } finally {
                    if (
                        !controller.signal
                            .aborted
                    ) {
                        setLoading(false);
                    }
                }
            };

        void initialise();

        return () => {
            controller.abort();
        };
    }, [loadContacts]);


    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            await loadContacts();

            return true;
        } catch (error) {
            if (
                typeof error ===
                'object' &&
                error !== null &&
                'message' in error
            ) {
                setLoadError(
                    error as ApiErrorDetails
                );
            } else {
                setLoadError(
                    getNetworkErrorDetails()
                );
            }

            return false;
        } finally {
            setRetrying(false);
        }
    }


    /* ========================================================
       COMMON ACTION HELPERS
       ======================================================== */

    function showSuccess(
        message: string
    ) {
        setSuccessMessage(
            message
        );

        window.setTimeout(
            () => {
                setSuccessMessage(
                    current =>
                        current ===
                            message
                            ? null
                            : current
                );
            },
            3500
        );
    }


    async function actionFailure(
        response: Response,
        fallback: string
    ) {
        const details =
            await getApiErrorDetails(
                response,
                fallback
            );

        throw new Error(
            details.message
        );
    }


    function updateContactLocally(
        id: string,
        update: (
            contact: ContactMessage
        ) => ContactMessage
    ) {
        setContacts(
            current =>
                current.map(
                    contact =>
                        contact.id === id
                            ? update(
                                contact
                            )
                            : contact
                )
        );
    }


    /* ========================================================
       VIEW
       ======================================================== */

    async function openView(
        contact: ContactMessage
    ) {
        setActionError(null);
        setSuccessMessage(null);

        /*
         * Open the message immediately so the administrator
         * does not have to wait for the mark-read request.
         */
        setSelectedContact(
            contact
        );

        setViewOpen(true);

        if (contact.isRead) {
            return;
        }

        setMarkingReadId(
            contact.id
        );

        try {
            const response =
                await apiFetch(
                    `/api/contact/admin/${contact.id}/mark-read`,
                    {
                        method: 'POST',
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to mark the contact message as read.'
                );
            }

            const updatedContact:
                ContactMessage = {
                ...contact,
                isRead: true,
            };

            updateContactLocally(
                contact.id,
                current => ({
                    ...current,
                    isRead: true,
                })
            );

            setSelectedContact(
                updatedContact
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to mark the contact message as read.'
            );
        } finally {
            setMarkingReadId(
                null
            );
        }
    }


    function closeView() {
        if (markingReadId) {
            return;
        }

        setViewOpen(false);
        setSelectedContact(null);
    }


    /* ========================================================
       REPLY
       ======================================================== */

    function openReply(
        contact: ContactMessage
    ) {
        setActionError(null);
        setSuccessMessage(null);

        setReplyContact(
            contact
        );

        setReplyForm({
            subject:
                'Re: Your message to RCCG Hope House',
            body: '',
        });

        setReplyOpen(true);
    }


    function closeReply() {
        if (sendingReply) {
            return;
        }

        setReplyOpen(false);
        setReplyContact(null);
        setReplyForm(
            emptyReplyForm
        );
    }


    async function submitReply(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!replyContact) {
            return;
        }

        const subject =
            replyForm.subject.trim();

        const body =
            replyForm.body.trim();

        if (!subject) {
            setActionError(
                'Please enter a subject for the reply.'
            );
            return;
        }

        if (!body) {
            setActionError(
                'Please enter a reply message.'
            );
            return;
        }

        setSendingReply(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/contact/admin/${replyContact.id}/reply`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                subject,
                                body,
                            }),
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to send the reply.'
                );
            }

            const respondedAt =
                new Date().toISOString();

            updateContactLocally(
                replyContact.id,
                current => ({
                    ...current,
                    isRead: true,
                    respondedAt,
                })
            );

            /*
             * Keep the View modal in sync if the same
             * contact is currently being viewed.
             */
            setSelectedContact(
                current =>
                    current?.id ===
                        replyContact.id
                        ? {
                            ...current,
                            isRead: true,
                            respondedAt,
                        }
                        : current
            );

            setReplyOpen(false);
            setReplyContact(null);
            setReplyForm(
                emptyReplyForm
            );

            showSuccess(
                'Reply sent successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to send the reply.'
            );
        } finally {
            setSendingReply(false);
        }
    }


    /* ========================================================
       DELETE
       ======================================================== */

    function requestDelete(
        contact: ContactMessage
    ) {
        setActionError(null);
        setSuccessMessage(null);

        setDeleteContact(
            contact
        );
    }


    function closeDeleteConfirmation() {
        if (deletingId) {
            return;
        }

        setDeleteContact(null);
    }


    async function confirmDelete() {
        if (!deleteContact) {
            return;
        }

        const contact =
            deleteContact;

        setDeletingId(
            contact.id
        );

        setActionError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/contact/admin/${contact.id}`,
                    {
                        method: 'DELETE',
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to delete the contact message.'
                );
            }

            setContacts(
                current =>
                    current.filter(
                        item =>
                            item.id !==
                            contact.id
                    )
            );

            if (
                selectedContact?.id ===
                contact.id
            ) {
                setViewOpen(false);
                setSelectedContact(null);
            }

            if (
                replyContact?.id ===
                contact.id
            ) {
                setReplyOpen(false);
                setReplyContact(null);
                setReplyForm(
                    emptyReplyForm
                );
            }

            setDeleteContact(null);

            showSuccess(
                'Contact message deleted successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete the contact message.'
            );

            setDeleteContact(null);
        } finally {
            setDeletingId(null);
        }
    }


    /* ========================================================
       RENDER
       ======================================================== */

    return (
        <AdminLayout>
            <section className="contacts-admin-page">

                {/* =================================================
                    HEADER
                   ================================================= */}

                <div className="contacts-admin-header">
                    <div>
                        <span className="admin-eyebrow">
                            Connect
                        </span>

                        <h1>
                            Contact Messages
                        </h1>

                        <p>
                            Review enquiries received through the
                            RCCG Hope House Contact Us form and
                            respond directly from the Info mailbox.
                        </p>
                    </div>

                    {!loading &&
                        !loadError && (
                            <div className="contacts-header-unread">
                                <span>
                                    {unreadCount}
                                </span>

                                <div>
                                    <strong>
                                        Unread
                                    </strong>

                                    <small>
                                        message
                                        {unreadCount === 1
                                            ? ''
                                            : 's'}
                                    </small>
                                </div>
                            </div>
                        )}
                </div>


                {/* =================================================
                    ACTION MESSAGES
                   ================================================= */}

                {actionError && (
                    <div
                        className="admin-message admin-message-error"
                        role="alert"
                    >
                        <div>
                            <strong>
                                Something went wrong
                            </strong>

                            <p>
                                {actionError}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setActionError(
                                    null
                                )
                            }
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}


                {successMessage && (
                    <div
                        className="admin-message admin-message-success"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}


                {/* =================================================
                    LOADING / ERROR / CONTENT
                   ================================================= */}

                {loading ? (
                    <div className="admin-empty-state">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading contact messages...
                        </strong>
                    </div>
                ) : loadError ? (
                    <ApiErrorState
                        status={
                            loadError.status
                        }
                        title={
                            loadError.title
                        }
                        message={
                            loadError.message
                        }
                        onRetry={
                            retryLoad
                        }
                        retrying={
                            retrying
                        }
                    />
                ) : (
                    <>

                        {/* =========================================
                            SUMMARY
                           ========================================= */}

                        <div className="contact-summary-grid">
                            <div className="contact-summary-card">
                                <span className="contact-summary-icon">
                                    ✉
                                </span>

                                <div>
                                    <strong>
                                        {contacts.length}
                                    </strong>

                                    <small>
                                        Total Messages
                                    </small>
                                </div>
                            </div>


                            <div className="contact-summary-card unread">
                                <span className="contact-summary-icon">
                                    ●
                                </span>

                                <div>
                                    <strong>
                                        {unreadCount}
                                    </strong>

                                    <small>
                                        Unread
                                    </small>
                                </div>
                            </div>


                            <div className="contact-summary-card read">
                                <span className="contact-summary-icon">
                                    ✓
                                </span>

                                <div>
                                    <strong>
                                        {readCount}
                                    </strong>

                                    <small>
                                        Read
                                    </small>
                                </div>
                            </div>


                            <div className="contact-summary-card replied">
                                <span className="contact-summary-icon">
                                    ↩
                                </span>

                                <div>
                                    <strong>
                                        {repliedCount}
                                    </strong>

                                    <small>
                                        Replied
                                    </small>
                                </div>
                            </div>
                        </div>


                        {/* =========================================
                            MESSAGE MANAGEMENT
                           ========================================= */}

                        <article className="admin-panel contact-management-panel">

                            <div className="contact-toolbar">
                                <div>
                                    <h2>
                                        Message Inbox
                                    </h2>

                                    <p>
                                        View, reply to and manage
                                        messages submitted through
                                        the website.
                                    </p>
                                </div>

                                <div className="contact-toolbar-controls">
                                    <input
                                        type="search"
                                        value={
                                            search
                                        }
                                        onChange={
                                            event =>
                                                setSearch(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        placeholder="Search messages..."
                                        aria-label="Search contact messages"
                                        className="contact-search"
                                    />

                                    <select
                                        value={
                                            filter
                                        }
                                        onChange={
                                            event =>
                                                setFilter(
                                                    event
                                                        .target
                                                        .value as ContactFilter
                                                )
                                        }
                                        aria-label="Filter contact messages"
                                        className="contact-filter"
                                    >
                                        <option value="all">
                                            All messages
                                        </option>

                                        <option value="unread">
                                            Unread
                                        </option>

                                        <option value="read">
                                            Read
                                        </option>

                                        <option value="replied">
                                            Replied
                                        </option>
                                    </select>
                                </div>
                            </div>


                            {contacts.length === 0 ? (
                                <div className="admin-empty-state">
                                    <span className="admin-empty-icon">
                                        ✉
                                    </span>

                                    <strong>
                                        No contact messages
                                    </strong>

                                    <p>
                                        Contact Us submissions
                                        will appear here when
                                        visitors send them.
                                    </p>
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="admin-empty-state">
                                    <strong>
                                        No matching messages
                                    </strong>

                                    <p>
                                        Try changing your search
                                        or status filter.
                                    </p>
                                </div>
                            ) : (
                                <div className="admin-table-wrapper">
                                    <table className="admin-data-table contact-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Sender
                                                </th>

                                                <th>
                                                    Reason
                                                </th>

                                                <th>
                                                    Message
                                                </th>

                                                <th>
                                                    Received
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredContacts.map(
                                                contact => {
                                                    const status =
                                                        contactStatus(
                                                            contact
                                                        );

                                                    return (
                                                        <tr
                                                            key={
                                                                contact.id
                                                            }
                                                            className={
                                                                status ===
                                                                    'unread'
                                                                    ? 'contact-row-unread'
                                                                    : undefined
                                                            }
                                                        >
                                                            <td>
                                                                <div className="contact-sender-cell">
                                                                    <div className="contact-avatar">
                                                                        {contact.firstName
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                        {contact.lastName
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </div>

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                contact.firstName
                                                                            }{' '}
                                                                            {
                                                                                contact.lastName
                                                                            }
                                                                        </strong>

                                                                        <small>
                                                                            {
                                                                                contact.email
                                                                            }
                                                                        </small>

                                                                        {contact.phoneNumber && (
                                                                            <small>
                                                                                {
                                                                                    contact.phoneNumber
                                                                                }
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <span className="contact-reason">
                                                                    {contactReasonName(
                                                                        contact.reason
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <p className="contact-message-preview">
                                                                    {messagePreview(
                                                                        contact.message
                                                                    )}
                                                                </p>
                                                            </td>

                                                            <td>
                                                                <span className="contact-date">
                                                                    {formatDateTime(
                                                                        contact.createdAt
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`contact-status contact-status-${status}`}
                                                                >
                                                                    {contactStatusLabel(
                                                                        contact
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <AdminActionButtons
                                                                    itemName={`${contact.firstName} ${contact.lastName}`}
                                                                    onView={() =>
                                                                        void openView(
                                                                            contact
                                                                        )
                                                                    }
                                                                    onReply={() =>
                                                                        openReply(
                                                                            contact
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        requestDelete(
                                                                            contact
                                                                        )
                                                                    }
                                                                    viewTitle="View message"
                                                                    replyTitle="Reply to message"
                                                                    deleteTitle="Delete message"
                                                                    disabled={
                                                                        deletingId ===
                                                                        contact.id
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </article>
                    </>
                )}


                {/* =================================================
                    VIEW MESSAGE MODAL
                   ================================================= */}

                {viewOpen &&
                    selectedContact && (
                        <div
                            className="admin-modal-backdrop"
                            role="presentation"
                        >
                            <div
                                className="admin-modal contact-view-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="contact-view-title"
                            >
                                <div className="contact-modal-header">
                                    <div>
                                        <span className="admin-eyebrow">
                                            Contact Message
                                        </span>

                                        <h2 id="contact-view-title">
                                            {selectedContact.firstName}{' '}
                                            {selectedContact.lastName}
                                        </h2>

                                        <p>
                                            Received{' '}
                                            {formatDateTime(
                                                selectedContact.createdAt
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="contact-modal-close"
                                        onClick={
                                            closeView
                                        }
                                        disabled={
                                            markingReadId !==
                                            null
                                        }
                                        aria-label="Close message"
                                    >
                                        ×
                                    </button>
                                </div>


                                <div className="contact-view-body">
                                    <div className="contact-detail-grid">
                                        <div className="contact-detail-card">
                                            <span>
                                                Name
                                            </span>

                                            <strong>
                                                {
                                                    selectedContact.firstName
                                                }{' '}
                                                {
                                                    selectedContact.lastName
                                                }
                                            </strong>
                                        </div>

                                        <div className="contact-detail-card">
                                            <span>
                                                Email
                                            </span>

                                            <strong>
                                                {
                                                    selectedContact.email
                                                }
                                            </strong>
                                        </div>

                                        <div className="contact-detail-card">
                                            <span>
                                                Phone
                                            </span>

                                            <strong>
                                                {selectedContact.phoneNumber ??
                                                    'Not provided'}
                                            </strong>
                                        </div>

                                        <div className="contact-detail-card">
                                            <span>
                                                Reason
                                            </span>

                                            <strong>
                                                {contactReasonName(
                                                    selectedContact.reason
                                                )}
                                            </strong>
                                        </div>

                                        <div className="contact-detail-card">
                                            <span>
                                                Status
                                            </span>

                                            <strong>
                                                {contactStatusLabel(
                                                    selectedContact
                                                )}
                                            </strong>
                                        </div>

                                        <div className="contact-detail-card">
                                            <span>
                                                Replied
                                            </span>

                                            <strong>
                                                {selectedContact.respondedAt
                                                    ? formatDateTime(
                                                        selectedContact.respondedAt
                                                    )
                                                    : 'Not yet'}
                                            </strong>
                                        </div>
                                    </div>


                                    <div className="contact-full-message">
                                        <span>
                                            Message
                                        </span>

                                        <p>
                                            {
                                                selectedContact.message
                                            }
                                        </p>
                                    </div>


                                    {markingReadId ===
                                        selectedContact.id && (
                                            <p className="contact-marking-read">
                                                Marking message as read...
                                            </p>
                                        )}
                                </div>


                                <div className="admin-modal-actions contact-modal-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            closeView
                                        }
                                        disabled={
                                            markingReadId !==
                                            null
                                        }
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={() => {
                                            const contact =
                                                selectedContact;

                                            setViewOpen(
                                                false
                                            );

                                            setSelectedContact(
                                                null
                                            );

                                            openReply(
                                                contact
                                            );
                                        }}
                                        disabled={
                                            markingReadId !==
                                            null
                                        }
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                {/* =================================================
                    REPLY MODAL
                   ================================================= */}

                {replyOpen &&
                    replyContact && (
                        <div
                            className="admin-modal-backdrop"
                            role="presentation"
                        >
                            <div
                                className="admin-modal contact-reply-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="contact-reply-title"
                            >
                                <div className="contact-modal-header">
                                    <div>
                                        <span className="admin-eyebrow">
                                            Reply
                                        </span>

                                        <h2 id="contact-reply-title">
                                            Reply to{' '}
                                            {replyContact.firstName}{' '}
                                            {replyContact.lastName}
                                        </h2>

                                        <p>
                                            The reply will be sent
                                            from the RCCG Hope House
                                            Info mailbox.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="contact-modal-close"
                                        onClick={
                                            closeReply
                                        }
                                        disabled={
                                            sendingReply
                                        }
                                        aria-label="Close reply"
                                    >
                                        ×
                                    </button>
                                </div>


                                <form
                                    onSubmit={
                                        submitReply
                                    }
                                >
                                    <div className="contact-reply-body">

                                        <div className="admin-form-group">
                                            <label htmlFor="contact-reply-recipient">
                                                Recipient
                                            </label>

                                            <input
                                                id="contact-reply-recipient"
                                                type="email"
                                                value={
                                                    replyContact.email
                                                }
                                                readOnly
                                            />
                                        </div>


                                        <div className="admin-form-group">
                                            <label htmlFor="contact-reply-subject">
                                                Subject
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="contact-reply-subject"
                                                type="text"
                                                value={
                                                    replyForm.subject
                                                }
                                                onChange={
                                                    event =>
                                                        setReplyForm(
                                                            current => ({
                                                                ...current,
                                                                subject:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                                maxLength={
                                                    250
                                                }
                                                required
                                                disabled={
                                                    sendingReply
                                                }
                                            />
                                        </div>


                                        <div className="admin-form-group">
                                            <label htmlFor="contact-reply-body">
                                                Message
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <textarea
                                                id="contact-reply-body"
                                                rows={
                                                    10
                                                }
                                                value={
                                                    replyForm.body
                                                }
                                                onChange={
                                                    event =>
                                                        setReplyForm(
                                                            current => ({
                                                                ...current,
                                                                body:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                                placeholder={`Write your reply to ${replyContact.firstName}...`}
                                                required
                                                disabled={
                                                    sendingReply
                                                }
                                            />
                                        </div>


                                        <div className="contact-original-message">
                                            <span>
                                                Original Message
                                            </span>

                                            <p>
                                                {
                                                    replyContact.message
                                                }
                                            </p>
                                        </div>
                                    </div>


                                    <div className="admin-modal-actions contact-modal-actions">
                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={
                                                closeReply
                                            }
                                            disabled={
                                                sendingReply
                                            }
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="admin-primary-button"
                                            disabled={
                                                sendingReply
                                            }
                                        >
                                            {sendingReply
                                                ? 'Sending...'
                                                : 'Send Reply'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}


                {/* =================================================
                    DELETE CONFIRMATION
                   ================================================= */}

                <ConfirmDialog
                    open={
                        deleteContact !== null
                    }
                    title="Delete Contact Message"
                    message={
                        deleteContact
                            ? `Are you sure you want to permanently delete the message from ${deleteContact.firstName} ${deleteContact.lastName}? This action cannot be undone.`
                            : ''
                    }
                    confirmText="Delete Message"
                    loadingText="Deleting..."
                    variant="danger"
                    loading={
                        deletingId !== null
                    }
                    onConfirm={() =>
                        void confirmDelete()
                    }
                    onCancel={
                        closeDeleteConfirmation
                    }
                />

            </section>
        </AdminLayout>
    );
}