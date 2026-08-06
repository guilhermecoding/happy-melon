import Image from "next/image";
import Section from "../ui/section";
import TitlePage from "../title-page";
import { Separator } from "../ui/separator";
import { IconBrandGithubFilled, IconBrandLinkedinFilled, IconExternalLink, IconMailFilled } from "@tabler/icons-react";
import Link from "next/link";
import Page from "../ui/page";
import { APP_VERSION } from "@/lib/app-version";

export default function AboutPage() {
    return (
        <Page>
            <Section>
                <TitlePage title="Sobre" />
            </Section>

            <Section className="mt-6">
                <div className="flex flex-col justify-center items-center">
                    <Image
                        src="/logo-texto.svg"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="pointer-events-none w-76 sm:w-96 h-auto"
                    />
                    <span className="mt-2 text-sm text-muted-foreground">
                        release version v{APP_VERSION}
                    </span>
                </div>
            </Section>

            <Separator className="my-6" />

            <Section>
                <h2 className="text-2xl text-muted-foreground font-bold">Informações:</h2>

                <div className="flex flex-col gap-4 mt-6">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Aplicação:</span>
                        <span className="text-base font-bold">Happy Melon</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Versão:</span>
                        <Link href="https://github.com/guilhermecoding/happy-melon/releases"
                            className="text-base font-bold flex items-center gap-1 underline text-blue-400 w-max"
                            target="_blank"
                        >
                            v{APP_VERSION} <IconExternalLink className="size-4" />
                        </Link>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Data de lançamento:</span>
                        <span className="text-base font-bold">--/--/2026</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Criador/Desenvolvedor:</span>
                        <span className="text-base font-bold">
                            João Guiherme Araújo Viana
                        </span>
                        <Link href="https://www.linkedin.com/in/jo%C3%A3o-guilherme-ara%C3%BAjo-viana/"
                            className="text-base text-blue-500 hover:underline font-bold flex items-center gap-1 w-max"
                            target="_blank"
                        >
                            <IconBrandLinkedinFilled className="size-4" /> LinkedIn <IconExternalLink className="size-4" />
                        </Link>
                        <Link href="https://github.com/guilhermecoding"
                            className="text-base text-gray-500 hover:underline font-bold flex items-center gap-1 w-max"
                            target="_blank"
                        >
                            <IconBrandGithubFilled className="size-4" /> GitHub <IconExternalLink className="size-4" />
                        </Link>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Contato:</span>
                        <Link href="mailto:joaoguilhermearaujo1617@gmail.com"
                            className="text-base text-red-500 hover:underline font-bold flex items-center gap-1 w-max"
                            target="_blank"
                        >
                            <IconMailFilled className="size-4" />
                            joaoguilhermearaujo1617@gmail.com <IconExternalLink className="size-4" />
                        </Link>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Agradecimentos:</span>
                        <span className="text-base font-medium italic">
                            &quot;Primeiramente, agradeço a <strong>Deus</strong> por me dar a oportunidade de criar este projeto.
                            <br />
                            Agradeço a minha mãe, por me apoiar em todos os momentos, aos meus amigos que apoiaram no desenvolvimento deste projeto
                            e a todos aqueles que acreditam no meu trabalho e usam este projeto.
                            &quot;
                        </span>
                    </div>
                </div>
            </Section>
        </Page>
    );
}