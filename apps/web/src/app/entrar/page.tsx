import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { Metadata } from "next"
import toSingleSearchParam from "@/lib/to-single-search-param"
import Page from "@/components/ui/page"
import Section from "@/components/ui/section"
import { IconHeartFilled } from "@tabler/icons-react"
import BackgroundColors from "@/components/ui/background-colors"

export const metadata: Metadata = {
  title: "Entrar",
}

async function LoginPageContent({
  searchParams,
}: Pick<PageProps<'/entrar'>, 'searchParams'>) {
  const query = await searchParams
  const contestCode = toSingleSearchParam(query.contest_code)

  return <LoginForm contestCode={contestCode} />
}

export default function LoginPage({
  searchParams,
}: PageProps<'/entrar'>) {
  return (
    <Page className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
      <BackgroundColors />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[url('/tic-tac-toe.svg')] bg-repeat bg-size-[96px_96px] opacity-[0.06]"
      />
      <Section className="relative z-10 w-full max-w-sm md:max-w-4xl px-0 sm:px-0">
        <Suspense>
          <LoginPageContent searchParams={searchParams} />
        </Suspense>
      </Section>
      <Section className="relative z-10 flex justify-center items-center mt-6">
        <span className="text-sm text-muted-foreground bg-white py-2 px-4 rounded-full border-3 border-muted-foreground flex flex-row items-center gap-1">
          Feito com <IconHeartFilled className="size-4 shrink-0" /> por <strong>João Guilherme</strong>
        </span>
      </Section>
    </Page>
  )
}
