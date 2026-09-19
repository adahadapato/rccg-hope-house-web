import { useState, useEffect } from 'react';
import { apiFetch } from '../api/api';
export interface ChurchContactMethod {
    id: string;
    type: 'Phone' | 'Email';
    value: string;
    label: string | null;
    displayOrder: number;
}

export interface ChurchInfo {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postCode: string | null;
    country: string;
    parishName: string;
    establishedYear: number;
    yearsOfMinistry: number;
    tagline: string;
    aboutLead: string;
    aboutText: string;
    multiCulturalStat: string;
    activeMemberCount: number;
    contactMethods: ChurchContactMethod[];
}

export function useChurchInfo() {
    const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiFetch('/api/church-info', { signal: controller.signal });
                if (!res.ok) throw new Error(`Failed to load church info (${res.status})`);
                const data: ChurchInfo = await res.json();
                setChurchInfo(data);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setError('Unable to load church information.');
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    return { churchInfo, loading, error };
}