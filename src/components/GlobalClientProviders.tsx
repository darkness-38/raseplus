"use client";

import { useMiner } from "@/hooks/useMiner";
import SupportPrompt from "@/components/SupportPrompt";
import TermsPrompt from "@/components/TermsPrompt";

/**
 * Sitewide client wrapper — mounts the miner hook and SupportPrompt
 * globally so they run on every page, not just /browse.
 */
export default function GlobalClientProviders({ children }: { children: React.ReactNode }) {
    useMiner();
    return (
        <>
            {children}
            <SupportPrompt />
            <TermsPrompt />
        </>
    );
}
