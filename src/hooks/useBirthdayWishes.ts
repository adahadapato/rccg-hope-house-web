import { useCallback, useEffect, useState } from 'react';

import {
    apiFetch,
    getApiErrorDetails,
} from '@/api/api';

/**
 * Birthday wishes left by visitors on "Celebrants of the Month"
 * photos. Wishes stay on the website only; nothing is sent to
 * members.
 */

export type BirthdayWishStatus = 'Pending' | 'Approved' | 'Rejected';

export type BirthdayWishDecisionSource = 'Ai' | 'Admin' | 'System';

export interface BirthdayWish {
    id: string;
    authorName: string;
    message: string;
    createdAt: string;
}

export interface SubmitBirthdayWishResult {
    status: BirthdayWishStatus;
    message: string;
    wish: BirthdayWish | null;
}

export interface AdminBirthdayWish {
    id: string;
    galleryImageId: string;
    imageTitle: string | null;
    imageThumbnailPath: string | null;
    authorName: string;
    message: string;
    status: BirthdayWishStatus;
    decisionSource: BirthdayWishDecisionSource;
    decisionReason: string | null;
    moderatedBy: string | null;
    moderatedAt: string | null;
    createdAt: string;
}

export interface BirthdayWishStats {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
}

/**
 * Fired by the admin Birthday Wishes page after an approve,
 * reject or delete, so the header bell refreshes its count.
 */
export const BIRTHDAY_WISHES_CHANGED_EVENT = 'hopehouse:birthday-wishes-changed';

export const WISH_NAME_MAX_LENGTH = 60;
export const WISH_MESSAGE_MAX_LENGTH = 500;

/** Same rule as the menu highlight and the API. */
const CELEBRANT_CATEGORY = /celebrant/i;

export function isCelebrantCategory(
    categoryName: string | null | undefined
): boolean {
    return Boolean(categoryName) &&
        CELEBRANT_CATEGORY.test(categoryName ?? '');
}

/* ============================================================
   PUBLIC: WISH COUNTS FOR THE GALLERY CARDS
   ============================================================ */

type WishCounts = Record<string, number>;

interface WishCountDto {
    galleryImageId: string;
    count: number;
}

let countsPromise: Promise<WishCounts> | null = null;
const countListeners = new Set<(counts: WishCounts) => void>();
let latestCounts: WishCounts = {};

function loadCounts(force = false): Promise<WishCounts> {
    if (!countsPromise || force) {
        countsPromise = apiFetch('/api/birthday-wishes/counts')
            .then(response => (response.ok ? response.json() : []))
            .then((data: unknown) => {
                const counts: WishCounts = {};

                if (Array.isArray(data)) {
                    for (const item of data as WishCountDto[]) {
                        if (item?.galleryImageId) {
                            counts[item.galleryImageId] = item.count ?? 0;
                        }
                    }
                }

                latestCounts = counts;
                countListeners.forEach(listener => listener(counts));

                return counts;
            })
            .catch(() => {
                // Counts are a nice extra: fail quietly and retry later.
                countsPromise = null;
                return latestCounts;
            });
    }

    return countsPromise;
}

/**
 * Number of approved wishes per celebrant photo.
 * One shared request, however many cards ask.
 */
export function useBirthdayWishCounts(): {
    counts: WishCounts;
    refreshCounts: () => void;
} {
    const [counts, setCounts] = useState<WishCounts>(latestCounts);

    useEffect(() => {
        countListeners.add(setCounts);
        void loadCounts();

        return () => {
            countListeners.delete(setCounts);
        };
    }, []);

    const refreshCounts = useCallback(() => {
        void loadCounts(true);
    }, []);

    return { counts, refreshCounts };
}

/* ============================================================
   PUBLIC: READ AND SEND WISHES
   ============================================================ */

export async function getBirthdayWishes(
    imageId: string,
    signal?: AbortSignal
): Promise<BirthdayWish[]> {
    const response = await apiFetch(
        `/api/birthday-wishes/image/${encodeURIComponent(imageId)}`,
        { signal }
    );

    if (!response.ok) {
        throw await getApiErrorDetails(
            response,
            'Birthday wishes could not be loaded.'
        );
    }

    const data: unknown = await response.json();

    return Array.isArray(data) ? (data as BirthdayWish[]) : [];
}

export async function submitBirthdayWish(input: {
    galleryImageId: string;
    authorName: string;
    message: string;
    /** Honeypot: hidden from people, must stay empty. */
    website: string;
}): Promise<SubmitBirthdayWishResult> {
    const response = await apiFetch('/api/birthday-wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (response.status === 429) {
        throw {
            status: 429,
            title: 'Too many wishes',
            message: 'You have sent several wishes in a short time. Please try again in a few minutes.',
        };
    }

    if (!response.ok) {
        throw await getApiErrorDetails(
            response,
            'Your wish could not be sent. Please try again.'
        );
    }

    return (await response.json()) as SubmitBirthdayWishResult;
}
