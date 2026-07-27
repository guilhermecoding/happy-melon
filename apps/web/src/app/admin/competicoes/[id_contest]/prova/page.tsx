import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import TitlePage from '@/components/title-page';
import { File02Icon, BubbleChatQuestionIcon, PlusSignCircleIcon } from '@hugeicons/core-free-icons';
import BoxFeatures from '@/components/box-features';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import BoxQuestions from './_components/box-questions';

export default function AdminExamPage() {
    return (
        <Page>
            <Section>
                <TitlePage title="Prova" icon={File02Icon} />
            </Section>
            <Section className='mt-6'>
                <div className='flex justify-end'>
                    <Button
                        variant="blue"
                        size="sm"
                        className='mb-2 flex w-full sm:w-fit'
                    >
                        <HugeiconsIcon icon={PlusSignCircleIcon} className='size-5 shrink-0' strokeWidth={3} />
                        Adicionar questão
                    </Button>
                </div>
                <BoxFeatures title="Questões da prova" icon={BubbleChatQuestionIcon}>
                    <BoxQuestions />
                </BoxFeatures>
            </Section>
        </Page>
    )
}
