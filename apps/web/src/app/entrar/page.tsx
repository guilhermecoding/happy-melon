import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { Metadata } from "next"
import toSingleSearchParam from "@/lib/to-single-search-param"

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
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-muted p-6 md:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/tic-tac-toe.svg')] bg-repeat bg-size-[96px_96px] opacity-[0.06]"
      />
      <div className="relative z-10 w-full max-w-sm md:max-w-4xl">
        <Suspense>
          <LoginPageContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
