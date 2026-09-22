import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/api/api';

export interface GalleryFeedImage {
    id: string;
    title: string;
    thumbnailPath: string;
    contentType: string;
    altText: string;
    categoryId: string | null;
    categoryName: string | null;
    tags: string[];
    isFeatured: boolean;
    eventDate: string | null;
    displayOrder: number;
}

export interface GalleryImageDetail extends GalleryFeedImage {
    description: string | null;
    imagePath: string;
    fileSizeBytes: number;
    width: number;
    height: number;
    isPublic: boolean;
    photographer: string | null;
    viewCount: number;
    createdAt: string;
}

interface UseGalleryResult {
    images: GalleryFeedImage[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const GALLERY_FEED_URL = '/api/gallery?skip=0&take=100';

function orderGalleryImages(
    images: GalleryFeedImage[]
): GalleryFeedImage[] {
    return [...images].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
        }

        const aDate = a.eventDate
            ? new Date(a.eventDate).getTime()
            : 0;

        const bDate = b.eventDate
            ? new Date(b.eventDate).getTime()
            : 0;

        return bDate - aDate;
    });
}

export default function useGallery(): UseGalleryResult {
    const [images, setImages] = useState<GalleryFeedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadGallery = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch(GALLERY_FEED_URL);

            if (!response.ok) {
                throw new Error(
                    `Unable to load gallery. Server returned ${response.status}.`
                );
            }

            const data =
                (await response.json()) as GalleryFeedImage[];

            setImages(orderGalleryImages(data));
        } catch (err) {
            console.error('Gallery loading error:', err);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load the gallery at the moment.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const initialiseGallery = async () => {
            try {
                const response = await apiFetch(GALLERY_FEED_URL, {
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `Unable to load gallery. Server returned ${response.status}.`
                    );
                }

                const data =
                    (await response.json()) as GalleryFeedImage[];

                if (controller.signal.aborted) {
                    return;
                }

                setImages(orderGalleryImages(data));
                setError(null);
            } catch (err) {
                if (
                    err instanceof DOMException &&
                    err.name === 'AbortError'
                ) {
                    return;
                }

                console.error('Gallery loading error:', err);

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load the gallery at the moment.'
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void initialiseGallery();

        return () => {
            controller.abort();
        };
    }, []);

    return {
        images,
        loading,
        error,
        refresh: loadGallery
    };
}

export async function getGalleryImageDetail(
    id: string
): Promise<GalleryImageDetail> {
    const response = await apiFetch(`/api/gallery/${id}`);

    if (!response.ok) {
        throw new Error(
            `Unable to load image details. Server returned ${response.status}.`
        );
    }

    return (await response.json()) as GalleryImageDetail;
}