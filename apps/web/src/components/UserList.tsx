'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type TeamRow = {
  id: string;
  name: string;
  role?: string | null;
  avatar_url?: string | null;
};

export function UserList() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseBrowser();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('team')
          .select('*')
          .order('name');

        if (error) throw error;
        if (!mounted) return;
        setRows((data ?? []) as TeamRow[]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load team');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;

  return (
    <ul className="divide-y rounded-lg border bg-white">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 p-3">
          {r.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.avatar_url} alt={r.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{r.name}</span>
            {r.role && <span className="text-xs text-gray-500">{r.role}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
