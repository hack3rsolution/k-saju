'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader } from '@k-saju/ui';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: {
    name: string;
  };
}

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        
        const userData = await response.json();
        setUsers(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        setError(errorMessage);
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Our Team"
          subtitle="Loading our amazing team members..."
          align="center"
          className="mb-12"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} padding="lg" shadow="md" className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Our Team"
          subtitle="Something went wrong while loading our team"
          align="center"
          className="mb-12"
        />
        <Card padding="lg" shadow="md" className="max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Team</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <SectionHeader
        title="Our Team"
        subtitle="Meet the amazing people behind K-Saju"
        align="center"
        className="mb-12"
      />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} padding="lg" shadow="md" className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {user.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {user.company.name}
              </p>
              <div className="space-y-1 text-sm text-gray-500">
                <p className="truncate">{user.email}</p>
                <p>{user.phone}</p>
                <a 
                  href={`https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {user.website}
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
