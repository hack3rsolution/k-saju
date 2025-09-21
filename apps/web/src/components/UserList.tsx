'use client';

import { useEffect, useState } from 'react';
import { Card, SectionHeader } from '@k-saju/ui';
import { supabase } from '@/lib/supabase';

type TeamRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
};

export default function UserList() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) Supabase가 설정되어 있고, 쿼리가 성공하면 그 데이터를 사용
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          const { data, error } = await supabase
            .from('team')
            .select('*')
            .order('name');

          if (error) throw error;
          if (data && data.length > 0) {
            setRows(data as unknown as TeamRow[]);
            return;
          }
        }

        // 2) Supabase가 비어있거나 실패했으면 정적 파일로 폴백
        const res = await fetch('/team.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('fallback team.json not found');
        const fallback = (await res.json()) as TeamRow[];
        setRows(fallback);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load team');
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <SectionHeader
        title="Our Team"
        subtitle="Meet the amazing people behind K-Saju"
        align="center"
      />
      {error && (
        <p className="text-center text-sm text-red-500 mb-4">
          {error}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => (
          <Card key={m.id} padding="lg" shadow="lg">
            <div className="text-center space-y-1.5">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 text-white grid place-content-center text-xl font-semibold">
                {m.name?.[0] ?? 'U'}
              </div>
              <div className="mt-2 font-semibold">{m.name}</div>
              <div className="text-sm text-gray-500">{m.company}</div>
              <div className="text-sm text-gray-600">{m.email}</div>
              <div className="text-sm text-gray-600">{m.phone}</div>
              <a
                href={`https://${m.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {m.website}
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
