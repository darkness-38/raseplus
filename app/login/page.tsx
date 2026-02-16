import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - Rase+',
    description: 'Sign in to your Rase+ account to start streaming.',
};

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Enter your details to access your account."
        >
            <LoginForm />
        </AuthLayout>
    );
}
