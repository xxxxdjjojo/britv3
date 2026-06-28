"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * MessageScroller -- vertical scroll container for a conversation that sticks to
 * the bottom as new messages arrive. Auto-scrolls on mount and whenever the
 * dependency in `stickToBottomKey` changes (e.g. message count), unless the user
 * has scrolled up to read history.
 */
function MessageScroller({
  className,
  children,
  stickToBottomKey,
  ...props
}: React.ComponentProps<"div"> & {
  /** Change this (e.g. message count) to trigger a stick-to-bottom scroll. */
  stickToBottomKey?: string | number
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const isPinnedRef = React.useRef(true)

  const handleScroll = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight
    isPinnedRef.current = distanceFromBottom < 80
  }, [])

  React.useEffect(() => {
    const el = viewportRef.current
    if (!el || !isPinnedRef.current) return
    el.scrollTop = el.scrollHeight
  }, [stickToBottomKey])

  return (
    <div
      ref={viewportRef}
      data-slot="message-scroller"
      onScroll={handleScroll}
      className={cn("flex-1 overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { MessageScroller }
