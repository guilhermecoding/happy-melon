import { Balloon } from "@/components/balloon";
import { IconButton } from "@/components/pouf/Button";
import { Blob } from "@/components/pouf/media";
import { Card } from "@/components/pouf/surface";
import { COLOR } from "@/services/question/balloon-color";
import { BalloonIcon, Clock01Icon, HandIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

function TaskItem() {
    return (
        <Card variant="flush">
            <div className="flex items-center gap-2 px-5 py-6">
                <Balloon color={COLOR.BLUE} className="size-10" />
                <div className="flex flex-col">
                    <span className="text-xl font-bold">Aoooo Powtência</span>
                    <span className="text-sm text-muted-foreground">Levantou um balão azul!</span>
                    <div className="flex items-center gap-1 mt-1">
                        <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                        <span className="text-xs text-muted-foreground">Há 2 minutos</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <IconButton
                        tone="mint"
                        size="md"
                        variant="solid"
                        icon={<HugeiconsIcon icon={HandIcon} />}
                        label="Levantar balão"
                    >
                    </IconButton>
                </div>
            </div>
        </Card>
    )
}

export default function QueueTask() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-7 flex-col gap-4 overflow-hidden rounded-4xl border-4 border-blue bg-white px-3 py-4">
            <div className="flex shrink-0 items-center gap-3 px-3">
                <Blob
                    icon={
                        <HugeiconsIcon
                            icon={BalloonIcon}
                            strokeWidth={2.5}
                        />
                    }
                    size="sm"
                    tone="blue"
                />
                <span className="text-xl font-bold">Tarefas</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-2 rounded-4xl">
                <TaskItem />
                <TaskItem />
                <TaskItem />
                <TaskItem />
                <TaskItem />
                <TaskItem />
                <TaskItem />
            </div>
        </div>
    )
}
