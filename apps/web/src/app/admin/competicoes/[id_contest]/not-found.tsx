import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';

export default function ContestNotFound() {
  return (
    <Page>
      <Section className="flex flex-col items-start gap-4 py-10">
        <h1 className="text-2xl font-bold">Competição não encontrada</h1>
        <p className="text-muted-foreground">
          A competição solicitada não existe ou foi removida.
        </p>
        <Button variant="blue" size="sm" render={<Link href="/admin/competicoes" />}>
          Voltar para competições
        </Button>
      </Section>
    </Page>
  );
}
