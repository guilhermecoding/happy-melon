import Page from "@/components/ui/page";
import Section from "@/components/ui/section";
import { ArrowUpRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
    return (
        <Page>
            <Section className="flex flex-col items-center justify-center h-screen mb-4">
                <Image
                    src="/logo-texto.svg"
                    alt="Sleep cat"
                    width={100}
                    height={100}
                    className="h-auto w-72 opacity-50 grayscale"
                />
                <h1 className="text-2xl font-bold">
                    Ops! Página não encontrada.
                </h1>
                <p className="text-base text-muted-foreground mt-2">
                    A página que você está procurando não existe.
                </p>
                <Link href="/" className="mt-12 flex items-center gap-2 hover:underline">
                    Voltar para a página inicial
                    <HugeiconsIcon icon={ArrowUpRight02Icon} className="size-4" />
                </Link>
            </Section>
        </Page>
    )
}
