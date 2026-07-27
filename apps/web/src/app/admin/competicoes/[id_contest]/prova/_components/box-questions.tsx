import FlashCardQuestions from './flash-card-questions';

export default function BoxQuestions() {
    return (
        <div className='p-4 grid grid-cols-1 @lg/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4'>
            <FlashCardQuestions />
            <FlashCardQuestions />
            <FlashCardQuestions />
            <FlashCardQuestions />
            <FlashCardQuestions />
        </div>
    )
}
