import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/home');
  return null;
}
