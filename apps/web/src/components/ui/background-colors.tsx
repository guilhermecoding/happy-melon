import React from 'react'

export default function BackgroundColors() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-pink/45 blur-3xl" />
      <div className="absolute top-1/4 -right-40 size-[34rem] rounded-full bg-purple/40 blur-3xl" />
      <div className="absolute -bottom-40 left-1/5 size-[32rem] rounded-full bg-mint/40 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/5 size-[22rem] rounded-full bg-blue/35 blur-3xl" />
      <div className="absolute top-2/3 left-1/2 size-[18rem] -translate-x-1/2 rounded-full bg-yellow/30 blur-3xl" />
    </div>
  )
}
