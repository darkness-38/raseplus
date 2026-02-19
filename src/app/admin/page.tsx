"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/adminAuth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    useSiteConfig,
    updateSiteConfig,
    SiteConfig,
    BenefitItem,
    PlanItem,
    FaqItem,
    NavLink,
    SocialLink,
    FooterColumn,
} from "@/lib/siteConfig";

/* ─── Tabs ─── */
const TABS = ["General", "Navbar", "Landing Page", "Auth Pages", "Browse", "Footer"] as const;
type Tab = (typeof TABS)[number];

/* ─── Reusable UI ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            className="text-lg font-bold text-white mb-4"
            style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
        >
            {children}
        </h3>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {children}
        </label>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    multiline,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
}) {
    const style: React.CSSProperties = {
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
    };
    if (multiline) {
        return (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none focus:border-[#8B5CF6]/40 resize-none"
                style={style}
            />
        );
    }
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none focus:border-[#8B5CF6]/40"
            style={style}
        />
    );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-2xl p-6 ${className}`}
            style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {children}
        </div>
    );
}

/* ─── Main Page ─── */

export default function AdminPage() {
    const { authenticated, loading: authLoading, logout } = useAdminAuth();
    const router = useRouter();
    const { config, loading: configLoading } = useSiteConfig();

    const [activeTab, setActiveTab] = useState<Tab>("General");
    const [draft, setDraft] = useState<SiteConfig>(config);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync draft when config loads
    useEffect(() => {
        if (!configLoading) setDraft(config);
    }, [config, configLoading]);

    // Auth guard — redirect to admin login
    useEffect(() => {
        if (!authLoading && !authenticated) router.push("/admin/login");
    }, [authLoading, authenticated, router]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await updateSiteConfig(draft);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            console.error("Failed to save config:", e);
        } finally {
            setSaving(false);
        }
    }, [draft]);

    // Updaters
    const set = useCallback(
        <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
            setDraft((prev) => ({ ...prev, [key]: value }));
        },
        []
    );

    const setNested = useCallback(
        <S extends "landing" | "auth" | "footer" | "navbar" | "theme" | "profiles" | "browse">(
            section: S,
            key: string,
            value: unknown
        ) => {
            setDraft((prev) => ({
                ...prev,
                [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
            }));
        },
        []
    );

    if (authLoading || configLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
                    >
                        ⚙ Site Configuration
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Edit every aspect of your site in real-time
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{
                            backgroundColor: saved ? "#22c55e" : "#8B5CF6",
                            color: "white",
                            boxShadow: `0 0 20px rgba(139,92,246,0.3)`,
                        }}
                    >
                        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
                    </button>
                    {/* Logout */}
                    <button
                        onClick={() => { logout(); router.push("/admin/login"); }}
                        className="px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:bg-white/5"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 p-1 rounded-full overflow-x-auto" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="relative px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                        style={{
                            color: activeTab === tab ? "white" : "rgba(255,255,255,0.4)",
                            fontFamily: "'Google Sans Flex', system-ui, sans-serif",
                        }}
                    >
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 rounded-full"
                                style={{ backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {activeTab === "General" && <GeneralTab draft={draft} set={set} setNested={setNested} />}
                    {activeTab === "Navbar" && <NavbarTab draft={draft} setNested={setNested} />}
                    {activeTab === "Landing Page" && <LandingTab draft={draft} setNested={setNested} />}
                    {activeTab === "Auth Pages" && <AuthTab draft={draft} setNested={setNested} />}
                    {activeTab === "Browse" && <BrowseTab draft={draft} setNested={setNested} />}
                    {activeTab === "Footer" && <FooterTab draft={draft} setNested={setNested} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ─── GENERAL TAB ─── */

type SetNested = (section: "landing" | "auth" | "footer" | "navbar" | "theme" | "profiles" | "browse", key: string, value: unknown) => void;

function GeneralTab({
    draft,
    set,
    setNested,
}: {
    draft: SiteConfig;
    set: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
    setNested: SetNested;
}) {
    return (
        <>
            <Card>
                <SectionTitle>Branding</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <FieldLabel>Site Name</FieldLabel>
                        <TextInput value={draft.siteName} onChange={(v) => set("siteName", v)} placeholder="Rase+" />
                    </div>
                    <div>
                        <FieldLabel>Accent Color</FieldLabel>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={draft.accentColor}
                                onChange={(e) => set("accentColor", e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                            />
                            <TextInput value={draft.accentColor} onChange={(v) => set("accentColor", v)} placeholder="#0DD6E8" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Logo</SectionTitle>
                <div className="space-y-4">
                    <div>
                        <FieldLabel>Logo URL (or path like /logo.png)</FieldLabel>
                        <TextInput value={draft.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="/logo.png" />
                    </div>
                    {draft.logoUrl && (
                        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Preview:</p>
                            <img
                                src={draft.logoUrl}
                                alt="Logo preview"
                                className="h-10 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <SectionTitle>Theme Colors</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {([
                        ["bgColor", "Background Color"],
                        ["surfaceColor", "Surface / Card Color"],
                        ["textPrimary", "Primary Text"],
                        ["textSecondary", "Secondary Text"],
                        ["textMuted", "Muted Text"],
                    ] as const).map(([key, label]) => (
                        <div key={key}>
                            <FieldLabel>{label}</FieldLabel>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                                    style={{ backgroundColor: draft.theme[key] }}
                                />
                                <TextInput
                                    value={draft.theme[key]}
                                    onChange={(v) => setNested("theme", key, v)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <SectionTitle>Profiles Page</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <FieldLabel>Title</FieldLabel>
                        <TextInput value={draft.profiles.title} onChange={(v) => setNested("profiles", "title", v)} />
                    </div>
                    <div>
                        <FieldLabel>Add Button Text</FieldLabel>
                        <TextInput value={draft.profiles.addButtonText} onChange={(v) => setNested("profiles", "addButtonText", v)} />
                    </div>
                </div>
            </Card>
        </>
    );
}

/* ─── NAVBAR TAB ─── */

function NavbarTab({ draft, setNested }: { draft: SiteConfig; setNested: SetNested }) {
    const nav = draft.navbar;

    const updateLink = (i: number, field: keyof NavLink, value: string) => {
        const updated = [...nav.links];
        updated[i] = { ...updated[i], [field]: value };
        setNested("navbar", "links", updated);
    };

    return (
        <>
            <Card>
                <SectionTitle>Navigation Links</SectionTitle>
                <div className="space-y-3 mb-4">
                    {nav.links.map((link, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex-1">
                                <FieldLabel>Label</FieldLabel>
                                <TextInput value={link.label} onChange={(v) => updateLink(i, "label", v)} />
                            </div>
                            <div className="flex-1">
                                <FieldLabel>URL Path</FieldLabel>
                                <TextInput value={link.href} onChange={(v) => updateLink(i, "href", v)} />
                            </div>
                            <button
                                onClick={() => setNested("navbar", "links", nav.links.filter((_, idx) => idx !== i))}
                                className="text-xs px-2 py-1 rounded-md hover:bg-red-500/20 transition-colors mt-5"
                                style={{ color: "rgba(239,68,68,0.7)" }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setNested("navbar", "links", [...nav.links, { label: "New Link", href: "/browse" }])}
                        className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
                        style={{ border: "1px dashed rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)" }}
                    >
                        + Add Link
                    </button>
                </div>
            </Card>

            <Card>
                <SectionTitle>Landing Page Buttons</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <FieldLabel>Login Button Text</FieldLabel>
                        <TextInput value={nav.loginButtonText} onChange={(v) => setNested("navbar", "loginButtonText", v)} />
                    </div>
                    <div>
                        <FieldLabel>Register Button Text</FieldLabel>
                        <TextInput value={nav.registerButtonText} onChange={(v) => setNested("navbar", "registerButtonText", v)} />
                    </div>
                </div>
            </Card>
        </>
    );
}

/* ─── LANDING TAB ─── */

function LandingTab({ draft, setNested }: { draft: SiteConfig; setNested: SetNested }) {
    const l = draft.landing;
    const setL = (key: string, value: unknown) => setNested("landing", key, value);

    return (
        <>
            {/* Hero Section */}
            <Card>
                <SectionTitle>Hero Section</SectionTitle>
                <div className="space-y-4">
                    <div>
                        <FieldLabel>Title</FieldLabel>
                        <TextInput value={l.heroTitle} onChange={(v) => setL("heroTitle", v)} />
                    </div>
                    <div>
                        <FieldLabel>Subtitle</FieldLabel>
                        <TextInput value={l.heroSubtitle} onChange={(v) => setL("heroSubtitle", v)} multiline />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>CTA Button Text</FieldLabel>
                            <TextInput value={l.ctaText} onChange={(v) => setL("ctaText", v)} />
                        </div>
                        <div>
                            <FieldLabel>Secondary CTA Text</FieldLabel>
                            <TextInput value={l.secondaryCtaText} onChange={(v) => setL("secondaryCtaText", v)} />
                        </div>
                    </div>
                    <div>
                        <FieldLabel>Hero Background Image URL</FieldLabel>
                        <TextInput value={l.heroImage} onChange={(v) => setL("heroImage", v)} />
                    </div>
                </div>
            </Card>

            {/* Partners */}
            <Card>
                <SectionTitle>Partners Section</SectionTitle>
                <FieldLabel>Label Text</FieldLabel>
                <TextInput value={l.partnersLabel} onChange={(v) => setL("partnersLabel", v)} />
            </Card>

            {/* Benefits */}
            <Card>
                <SectionTitle>Benefits Section</SectionTitle>
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Title (before highlight)</FieldLabel>
                            <TextInput value={l.benefitsTitle} onChange={(v) => setL("benefitsTitle", v)} />
                        </div>
                        <div>
                            <FieldLabel>Highlighted Word</FieldLabel>
                            <TextInput value={l.benefitsHighlight} onChange={(v) => setL("benefitsHighlight", v)} />
                        </div>
                    </div>
                    <div>
                        <FieldLabel>Subtitle</FieldLabel>
                        <TextInput value={l.benefitsSubtitle} onChange={(v) => setL("benefitsSubtitle", v)} multiline />
                    </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-3">
                    {l.benefits.map((b, i) => (
                        <AccordionEditor
                            key={i}
                            title={`${i + 1}. ${b.title || "Untitled"}`}
                            onRemove={() => setL("benefits", l.benefits.filter((_: BenefitItem, idx: number) => idx !== i))}
                        >
                            <div className="space-y-3">
                                <div><FieldLabel>Title</FieldLabel><TextInput value={b.title} onChange={(v) => { const u = [...l.benefits]; u[i] = { ...b, title: v }; setL("benefits", u); }} /></div>
                                <div><FieldLabel>Description</FieldLabel><TextInput value={b.desc} onChange={(v) => { const u = [...l.benefits]; u[i] = { ...b, desc: v }; setL("benefits", u); }} multiline /></div>
                                <div><FieldLabel>Image URL</FieldLabel><TextInput value={b.img} onChange={(v) => { const u = [...l.benefits]; u[i] = { ...b, img: v }; setL("benefits", u); }} /></div>
                            </div>
                        </AccordionEditor>
                    ))}
                    <AddButton label="Add Benefit" onClick={() => setL("benefits", [...l.benefits, { title: "New Benefit", desc: "Description", img: "" }])} />
                </div>
            </Card>

            {/* Plans */}
            <Card>
                <SectionTitle>Pricing Plans</SectionTitle>
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><FieldLabel>Title (before highlight)</FieldLabel><TextInput value={l.plansTitle} onChange={(v) => setL("plansTitle", v)} /></div>
                        <div><FieldLabel>Highlighted Word</FieldLabel><TextInput value={l.plansHighlight} onChange={(v) => setL("plansHighlight", v)} /></div>
                    </div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={l.plansSubtitle} onChange={(v) => setL("plansSubtitle", v)} multiline /></div>
                </div>

                <div className="space-y-3">
                    {l.plans.map((p, i) => (
                        <AccordionEditor
                            key={i}
                            title={p.name}
                            badge={p.highlighted ? "★" : undefined}
                            onRemove={() => setL("plans", l.plans.filter((_: PlanItem, idx: number) => idx !== i))}
                        >
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div><FieldLabel>Plan Name</FieldLabel><TextInput value={p.name} onChange={(v) => { const u = [...l.plans]; u[i] = { ...p, name: v }; setL("plans", u); }} /></div>
                                    <div><FieldLabel>Price</FieldLabel><TextInput value={p.price} onChange={(v) => { const u = [...l.plans]; u[i] = { ...p, price: v }; setL("plans", u); }} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><FieldLabel>Billing Period</FieldLabel><TextInput value={p.period} onChange={(v) => { const u = [...l.plans]; u[i] = { ...p, period: v }; setL("plans", u); }} /></div>
                                    <div><FieldLabel>Badge Text</FieldLabel><TextInput value={p.badge ?? ""} onChange={(v) => { const u = [...l.plans]; u[i] = { ...p, badge: v || undefined }; setL("plans", u); }} /></div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => { const u = [...l.plans]; u[i] = { ...p, highlighted: !p.highlighted }; setL("plans", u); }}
                                        className="flex items-center gap-2 text-sm"
                                        style={{ color: p.highlighted ? "#8B5CF6" : "rgba(255,255,255,0.4)" }}
                                    >
                                        <div className="w-4 h-4 rounded border flex items-center justify-center" style={{ borderColor: p.highlighted ? "#8B5CF6" : "rgba(255,255,255,0.2)", backgroundColor: p.highlighted ? "rgba(139,92,246,0.2)" : "transparent" }}>
                                            {p.highlighted && <span className="text-[10px]">✓</span>}
                                        </div>
                                        Highlight this plan
                                    </button>
                                </div>
                                <div>
                                    <FieldLabel>Features (one per line)</FieldLabel>
                                    <textarea
                                        value={p.features.join("\n")}
                                        onChange={(e) => { const u = [...l.plans]; u[i] = { ...p, features: e.target.value.split("\n") }; setL("plans", u); }}
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none resize-none"
                                        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                    />
                                </div>
                            </div>
                        </AccordionEditor>
                    ))}
                    <AddButton label="Add Plan" onClick={() => setL("plans", [...l.plans, { name: "New Plan", price: "$0", period: "Billed monthly", highlighted: false, features: [] }])} />
                </div>
            </Card>

            {/* FAQ */}
            <Card>
                <SectionTitle>FAQ Section</SectionTitle>
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><FieldLabel>Title</FieldLabel><TextInput value={l.faqTitle} onChange={(v) => setL("faqTitle", v)} /></div>
                        <div><FieldLabel>Highlighted Text</FieldLabel><TextInput value={l.faqHighlight} onChange={(v) => setL("faqHighlight", v)} /></div>
                    </div>
                </div>

                <div className="space-y-3">
                    {l.faqs.map((f, i) => (
                        <AccordionEditor
                            key={i}
                            title={`${i + 1}. ${f.q || "Untitled"}`}
                            onRemove={() => setL("faqs", l.faqs.filter((_: FaqItem, idx: number) => idx !== i))}
                        >
                            <div className="space-y-3">
                                <div><FieldLabel>Question</FieldLabel><TextInput value={f.q} onChange={(v) => { const u = [...l.faqs]; u[i] = { ...f, q: v }; setL("faqs", u); }} /></div>
                                <div><FieldLabel>Answer</FieldLabel><TextInput value={f.a} onChange={(v) => { const u = [...l.faqs]; u[i] = { ...f, a: v }; setL("faqs", u); }} multiline /></div>
                            </div>
                        </AccordionEditor>
                    ))}
                    <AddButton label="Add FAQ" onClick={() => setL("faqs", [...l.faqs, { q: "New Question?", a: "Answer here." }])} />
                </div>
            </Card>

            {/* Movies CTA */}
            <Card>
                <SectionTitle>Movies / Content Section</SectionTitle>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><FieldLabel>Title</FieldLabel><TextInput value={l.moviesTitle} onChange={(v) => setL("moviesTitle", v)} /></div>
                        <div><FieldLabel>Highlighted Text</FieldLabel><TextInput value={l.moviesHighlight} onChange={(v) => setL("moviesHighlight", v)} /></div>
                    </div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={l.moviesSubtitle} onChange={(v) => setL("moviesSubtitle", v)} multiline /></div>
                    <div><FieldLabel>CTA Button Text</FieldLabel><TextInput value={l.moviesCta} onChange={(v) => setL("moviesCta", v)} /></div>
                </div>
            </Card>
        </>
    );
}

/* ─── AUTH TAB ─── */

function AuthTab({ draft, setNested }: { draft: SiteConfig; setNested: SetNested }) {
    return (
        <>
            <Card>
                <SectionTitle>Login Page</SectionTitle>
                <div className="space-y-4">
                    <div><FieldLabel>Title</FieldLabel><TextInput value={draft.auth.loginTitle} onChange={(v) => setNested("auth", "loginTitle", v)} /></div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={draft.auth.loginSubtitle} onChange={(v) => setNested("auth", "loginSubtitle", v)} /></div>
                </div>
            </Card>
            <Card>
                <SectionTitle>Register Page</SectionTitle>
                <div className="space-y-4">
                    <div><FieldLabel>Title</FieldLabel><TextInput value={draft.auth.registerTitle} onChange={(v) => setNested("auth", "registerTitle", v)} /></div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={draft.auth.registerSubtitle} onChange={(v) => setNested("auth", "registerSubtitle", v)} /></div>
                </div>
            </Card>
        </>
    );
}

/* ─── BROWSE TAB ─── */

function BrowseTab({ draft, setNested }: { draft: SiteConfig; setNested: SetNested }) {
    const b = draft.browse;
    const setB = (key: string, value: unknown) => setNested("browse", key, value);

    return (
        <>
            <Card>
                <SectionTitle>General</SectionTitle>
                <div>
                    <FieldLabel>Loading Text</FieldLabel>
                    <TextInput value={b.loadingText} onChange={(v) => setB("loadingText", v)} placeholder="Loading Rase+..." />
                </div>
            </Card>

            <Card>
                <SectionTitle>Home Page — Content Row Titles</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><FieldLabel>Continue Watching</FieldLabel><TextInput value={b.continueWatchingTitle} onChange={(v) => setB("continueWatchingTitle", v)} /></div>
                    <div><FieldLabel>Trending Anime</FieldLabel><TextInput value={b.trendingAnimeTitle} onChange={(v) => setB("trendingAnimeTitle", v)} /></div>
                    <div><FieldLabel>Popular Movies</FieldLabel><TextInput value={b.popularMoviesTitle} onChange={(v) => setB("popularMoviesTitle", v)} /></div>
                    <div><FieldLabel>Latest Series</FieldLabel><TextInput value={b.latestSeriesTitle} onChange={(v) => setB("latestSeriesTitle", v)} /></div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Anime Page</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><FieldLabel>Page Title</FieldLabel><TextInput value={b.animePageTitle} onChange={(v) => setB("animePageTitle", v)} /></div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={b.animePageSubtitle} onChange={(v) => setB("animePageSubtitle", v)} /></div>
                    <div><FieldLabel>Top Rated Row Title</FieldLabel><TextInput value={b.topRatedAnimeTitle} onChange={(v) => setB("topRatedAnimeTitle", v)} /></div>
                    <div><FieldLabel>All Items Title</FieldLabel><TextInput value={b.allAnimeTitle} onChange={(v) => setB("allAnimeTitle", v)} /></div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Movies Page</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><FieldLabel>Page Title</FieldLabel><TextInput value={b.moviesPageTitle} onChange={(v) => setB("moviesPageTitle", v)} /></div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={b.moviesPageSubtitle} onChange={(v) => setB("moviesPageSubtitle", v)} /></div>
                    <div><FieldLabel>Top Rated Row Title</FieldLabel><TextInput value={b.topRatedMoviesTitle} onChange={(v) => setB("topRatedMoviesTitle", v)} /></div>
                    <div><FieldLabel>All Items Title</FieldLabel><TextInput value={b.allMoviesTitle} onChange={(v) => setB("allMoviesTitle", v)} /></div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Series Page</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><FieldLabel>Page Title</FieldLabel><TextInput value={b.seriesPageTitle} onChange={(v) => setB("seriesPageTitle", v)} /></div>
                    <div><FieldLabel>Subtitle</FieldLabel><TextInput value={b.seriesPageSubtitle} onChange={(v) => setB("seriesPageSubtitle", v)} /></div>
                    <div><FieldLabel>Top Rated Row Title</FieldLabel><TextInput value={b.topRatedSeriesTitle} onChange={(v) => setB("topRatedSeriesTitle", v)} /></div>
                    <div><FieldLabel>All Items Title</FieldLabel><TextInput value={b.allSeriesTitle} onChange={(v) => setB("allSeriesTitle", v)} /></div>
                </div>
            </Card>
        </>
    );
}

/* ─── FOOTER TAB ─── */

function FooterTab({ draft, setNested }: { draft: SiteConfig; setNested: SetNested }) {
    const f = draft.footer;
    const setF = (key: string, value: unknown) => setNested("footer", key, value);

    const updateSocial = (i: number, field: keyof SocialLink, value: string) => {
        const updated = [...f.socials];
        updated[i] = { ...updated[i], [field]: value };
        setF("socials", updated);
    };

    const updateColumn = (ci: number, col: FooterColumn) => {
        const updated = [...f.columns];
        updated[ci] = col;
        setF("columns", updated);
    };

    return (
        <>
            <Card>
                <SectionTitle>Footer Content</SectionTitle>
                <div className="space-y-4">
                    <div><FieldLabel>Description</FieldLabel><TextInput value={f.description} onChange={(v) => setF("description", v)} multiline /></div>
                    <div><FieldLabel>Copyright</FieldLabel><TextInput value={f.copyright} onChange={(v) => setF("copyright", v)} /></div>
                    <div><FieldLabel>Support Button Text</FieldLabel><TextInput value={f.supportButtonText} onChange={(v) => setF("supportButtonText", v)} /></div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Footer Columns</SectionTitle>
                <div className="space-y-3">
                    {f.columns.map((col, ci) => (
                        <AccordionEditor
                            key={ci}
                            title={col.title || "Untitled Column"}
                            onRemove={() => setF("columns", f.columns.filter((_: FooterColumn, idx: number) => idx !== ci))}
                        >
                            <div className="space-y-3">
                                <div><FieldLabel>Column Title</FieldLabel><TextInput value={col.title} onChange={(v) => updateColumn(ci, { ...col, title: v })} /></div>
                                <div>
                                    <FieldLabel>Links (one per line: Label | URL)</FieldLabel>
                                    <textarea
                                        value={col.links.map(l => `${l.label} | ${l.href}`).join("\n")}
                                        onChange={(e) => {
                                            const links = e.target.value.split("\n").map(line => {
                                                const [label = "", href = "#"] = line.split("|").map(s => s.trim());
                                                return { label, href };
                                            });
                                            updateColumn(ci, { ...col, links });
                                        }}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none resize-none"
                                        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                        placeholder={"Resources | #\nBlog | /blog"}
                                    />
                                </div>
                            </div>
                        </AccordionEditor>
                    ))}
                    <AddButton label="Add Column" onClick={() => setF("columns", [...f.columns, { title: "New Column", links: [{ label: "Link", href: "#" }] }])} />
                </div>
            </Card>

            <Card>
                <SectionTitle>Social Links</SectionTitle>
                <div className="space-y-3">
                    {f.socials.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <div><FieldLabel>Platform</FieldLabel><TextInput value={s.platform} onChange={(v) => updateSocial(i, "platform", v)} /></div>
                                    <div><FieldLabel>Handle</FieldLabel><TextInput value={s.handle} onChange={(v) => updateSocial(i, "handle", v)} /></div>
                                    <div><FieldLabel>URL</FieldLabel><TextInput value={s.url} onChange={(v) => updateSocial(i, "url", v)} /></div>
                                </div>
                            </div>
                            <button
                                onClick={() => setF("socials", f.socials.filter((_: SocialLink, idx: number) => idx !== i))}
                                className="text-xs px-2 py-1 rounded-md hover:bg-red-500/20 transition-colors mt-5"
                                style={{ color: "rgba(239,68,68,0.7)" }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <AddButton label="Add Social" onClick={() => setF("socials", [...f.socials, { platform: "Platform", handle: "@handle", url: "#" }])} />
                </div>
            </Card>
        </>
    );
}

/* ─── Shared Components ─── */

function AccordionEditor({
    title,
    badge,
    onRemove,
    children,
}: {
    title: string;
    badge?: string;
    onRemove: () => void;
    children: React.ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{title}</span>
                    {badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>
                            {badge}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="text-xs px-2 py-1 rounded-md hover:bg-red-500/20 cursor-pointer transition-colors"
                        style={{ color: "rgba(239,68,68,0.7)" }}
                    >
                        Remove
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
            style={{ border: "1px dashed rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)" }}
        >
            + {label}
        </button>
    );
}
