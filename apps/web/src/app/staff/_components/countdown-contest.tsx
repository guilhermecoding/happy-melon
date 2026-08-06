import FlipClock from '@/components/8starlabs-ui/flip-clock'

export default function CountdownContest() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4 md:gap-6 relative -top-1/5">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-center text-muted-foreground">
                    Começa em
                </h1>
                <FlipClock
                    variant="muted"
                    className="relative text-3xl md:text-5xl lg:text-7xl"
                    countdown
                />
            </div>
        </div>
    )
}
