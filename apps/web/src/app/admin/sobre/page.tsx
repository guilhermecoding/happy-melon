import AboutPage from "@/components/pages/about-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sobre",
}

export default function AdminAboutPage() {
    return (
        <AboutPage />
    )
}
