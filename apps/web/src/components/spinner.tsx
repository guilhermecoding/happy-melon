import { DashRing } from './loading-ui/dash-ring';

export default function Spinner() {
    return (
        <div className='flex items-center justify-center w-full h-56'>
            <DashRing className='size-16 text-muted-foreground' />
        </div>
    )
}
