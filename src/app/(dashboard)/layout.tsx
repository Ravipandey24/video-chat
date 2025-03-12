import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navbar';

/**
 * Layout for the dashboard section
 * Includes authentication check and common UI elements
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    // Redirect to login if not authenticated
    redirect('/login');
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation bar */}
      <Navbar user={session.user} />
      
      {/* Main content */}
      <main className="flex-1 container mx-auto py-6 px-4">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Video Q&A App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}