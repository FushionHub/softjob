import { useState, useEffect, useCallback } from 'react';

export function useAdminResource(url, options = {}) {
    const [data, setData] = useState(options.initialData || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(url);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || `Failed to fetch from ${url}`);
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (url) {
            fetchData();
        }
    }, [fetchData, url]);

    const mutate = async (actionUrl, { method = 'POST', body, headers = {} } = {}) => {
        try {
            const res = await fetch(actionUrl, {
                method,
                headers: { 'Content-Type': 'application/json', ...headers },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || 'Action failed');
            }
            const result = await res.json();
            await fetchData();
            return { success: true, result };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    return { data, setData, loading, error, refetch: fetchData, mutate };
}
