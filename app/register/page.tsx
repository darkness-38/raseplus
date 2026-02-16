import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Register - Rase+',
    description: 'Create a new Rase+ account to start streaming.',
};

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Join Rase+"
            subtitle="Create an account to unlock a world of entertainment."
        >
            <RegisterForm />
        </AuthLayout>
    );
}
