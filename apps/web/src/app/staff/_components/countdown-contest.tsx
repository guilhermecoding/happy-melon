import FlipClock from '@/components/8starlabs-ui/flip-clock'

export default function CountdownContest() {
    return (
        <div className="relative flex h-screen w-full items-center justify-center">
            <FlipClock
                variant="default"
                className="relative -top-1/5 text-5xl "
                countdown
            />
        </div>
    )
}
