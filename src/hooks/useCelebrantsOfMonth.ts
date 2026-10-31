import { useEffect, useState } from 'react';

import { apiFetch } from '@/api/api';

/**
 * Fired by the navigation when a visitor clicks "Gallery" while
 * celebrants are highlighted. The gallery listens for it, switches
 * to the celebrants category and scrolls to it.
 */
export const SHOW_CELEBRANTS_EVENT = 'hopehouse:show-celebrants';

export interface ShowCelebrantsDetail {
    categoryName: string;
}

interface FeedImage {
    categoryName: string | null;
    eventDate: string | null;
}

export interface CelebrantsOfMonth {
    /** Number of public celebrant photos dated in the current month. */
    count: number;
    /** The exact gallery category name, e.g. "Celebrants of the Month". */
    categoryName: string | null;
}

const FEED_URL = '/api/gallery?skip=0&take=100';
const CELEBRANT_CATEGORY = /celebrant/i;

let feedPromise: Promise<FeedImage[]> | null = null;

/** One shared request, however many components ask. */
function loadFeed(): Promise<FeedImage[]> {
    if (!feedPromise) {
        feedPromise = apiFetch(FEED_URL)
            .then(response => (response.ok ? response.json() : []))
            .then(data => (Array.isArray(data) ? (data as FeedImage[]) : []))
            .catch(() => {
                // Allow a retry on the next page load.
                feedPromise = null;
                return [];
            });
    }

    return feedPromise;
}

function isThisMonth(value: string | null, now: Date) {
    if (!value) return false;

    // Read the date part only, so a date such as 2026-11-01T00:00:00Z
    // still counts as 1 November whatever the visitor's time zone.
    const match = /^(\d{4})-(\d{2})/.exec(value);
    if (!match) return false;

    return (
        Number(match[1]) === now.getFullYear() &&
        Number(match[2]) === now.getMonth() + 1
    );
}

/**
 * Counts this month's celebrants in the public gallery.
 *
 * A photo counts when its category name contains "celebrant"
 * and its event date falls in the current month. Nothing needs
 * to be switched on or off in the admin: the highlight appears
 * when this month's celebrants are uploaded and disappears when
 * the month ends.
 */
export function useCelebrantsOfMonth(): CelebrantsOfMonth {
    const [result, setResult] = useState<CelebrantsOfMonth>({
        count: 0,
        categoryName: null,
    });

    useEffect(() => {
        let cancelled = false;

        void loadFeed().then(images => {
            if (cancelled) return;

            const now = new Date();
            const celebrants = images.filter(
                image =>
                    Boolean(image.categoryName) &&
                    CELEBRANT_CATEGORY.test(image.categoryName ?? '') &&
                    isThisMonth(image.eventDate, now)
            );

            setResult({
                count: celebrants.length,
                categoryName: celebrants[0]?.categoryName ?? null,
            });
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return result;
}
