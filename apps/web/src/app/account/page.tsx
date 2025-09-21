'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      // 현재 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      // 프로필 불러오기
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setWebsite(data.website || '');
        setPhone(data.phone || '');
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      website,
      phone,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    if (error) {
      alert('업데이트 실패: ' + error.message);
    } else {
      alert('업데이트 성공!');
    }

    setLoading(false);
  };

  if (loading) return <p className="p-4">Loading...</p>;

  if (!profile) return <p className="p-4">로그인이 필요합니다.</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">My Account</h1>

      <label className="block mb-2">
        <span className="text-sm text-gray-700">Full Name</span>
        <input
          className="w-full border p-2 rounded"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>

      <label className="block mb-2">
        <span className="text-sm text-gray-700">Website</span>
        <input
          className="w-full border p-2 rounded"
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-700">Phone</span>
        <input
          className="w-full border p-2 rounded"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleUpdate}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
