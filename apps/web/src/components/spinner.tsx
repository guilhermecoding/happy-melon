import { DotsRing } from './dots-ring';

export default function Spinner() {
    return (
        <div className='flex items-center justify-center w-full h-56'>
            <DotsRing className='size-16 text-muted-foreground' />
        </div>
    )
}
