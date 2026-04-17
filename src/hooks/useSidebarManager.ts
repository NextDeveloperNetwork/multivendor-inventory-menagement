import { useState, useEffect } from 'react';

const STORAGE_KEY = 'hidden_sidebar_pages';

export function useSidebarManager() {
    const [hiddenPages, setHiddenPages] = useState<string[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHiddenPages(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load hidden pages from local storage', e);
        }
    }, []);

    const togglePageVisibility = (href: string) => {
        setHiddenPages(prev => {
            let next;
            if (prev.includes(href)) {
                next = prev.filter(p => p !== href);
            } else {
                next = [...prev, href];
            }
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    const isHidden = (href: string) => {
        if (!isMounted) return false; // Default to visible on server to prevent hydration mismatch
        return hiddenPages.includes(href);
    };

    return {
        hiddenPages,
        togglePageVisibility,
        isHidden,
        isMounted
    };
}
