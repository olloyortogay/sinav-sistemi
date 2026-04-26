'use client';
import { useRouter } from 'next/navigation';
import AuthGate from '../../components/AuthGate';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = (user) => {
    // Giriş başarılı → profile'a yönlendir
    router.replace('/profile');
  };

  return (
    <AuthGate
      onSuccess={handleSuccess}
      redirectTo="/login"
      title="Türk Dünyası"
      subtitle="Sınav platformuna giriş yapın"
    />
  );
}
