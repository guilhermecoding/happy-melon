import React from 'react'
import FlashCardTeam from './flash-card-team'

export default function BoxTeamsList() {
    return (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            <FlashCardTeam />
            <FlashCardTeam />
            <FlashCardTeam />
            <FlashCardTeam />
            <FlashCardTeam />
        </div>
    )
}
