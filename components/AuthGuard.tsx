'use client';
import { ReactNode } from 'react';

export default function AuthGuard({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
