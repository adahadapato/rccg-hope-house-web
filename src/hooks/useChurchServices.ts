import { apiFetch } from '@/api/api';
import { useEffect, useState } from 'react';

export type RecurrencePattern =
    | 'Weekly'
    | 'LastOfMonth'
    | 'FirstOfMonth'
    | 'Fortnightly'
    | 'Monthly'
    | 'OneTime';

export interface ChurchServiceFeed {
    id: string;
    name: string;
    category: string;
    dayOfWeek: string;
    startTime: string; // "HH:mm:ss"
    endTime: string;

    description: string | null;

    location: string | null;
    zoomId: string | null;
    zoomPasscode: string | null;

    isLocal: boolean;
    isActive: boolean;

    recurrence: RecurrencePattern;
    dayOfMonth: number | null;

    displayOrder: number;

    icon: string | null;
    showInMonthlyServices: boolean;
}

export function useChurchServices(
    isLocal?: boolean
) {
    const [services, setServices] =
        useState<ChurchServiceFeed[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const controller =
            new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const params =
                    isLocal !== undefined
                        ? `?isLocal=${isLocal}`
                        : '';

                const res = await apiFetch(
                    `/api/services${params}`,
                    {
                        signal:
                            controller.signal,
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        `Failed to load services (${res.status})`
                    );
                }

                const data:
                    ChurchServiceFeed[] =
                    await res.json();

                setServices(data);
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError'
                ) {
                    setError(
                        'Unable to load service schedule.'
                    );
                }
            } finally {
                setLoading(false);
            }
        })();

        return () =>
            controller.abort();
    }, [isLocal]);

    return {
        services,
        loading,
        error,
    };
}

/** "19:00:00" → "7:00 PM" */
export function formatTime(
    time: string
): string {
    const [hStr, mStr] =
        time.split(':');

    let h = parseInt(hStr, 10);
    const m = mStr;

    const period =
        h >= 12 ? 'PM' : 'AM';

    h = h % 12;

    if (h === 0) {
        h = 12;
    }

    return `${h}:${m} ${period}`;
}

/**
 * "19:00:00", "19:40:00"
 * → "7:00 PM - 7:40 PM"
 */
export function formatTimeRange(
    start: string,
    end: string
): string {
    return `${formatTime(start)} - ${formatTime(end)}`;
}

const DAY_NAME_TO_NUMBER:
    Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

export function dayNameToNumber(
    day: string
): number {
    return (
        DAY_NAME_TO_NUMBER[day] ??
        0
    );
}