import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { chat } from '../content/site'
import { getAnswer } from '../chat/answerEngine'
import { chips } from '../chat/intents'

const HISTORY_KEY = 'xt-chat'
const NUDGE_KEY = 'xt-chat-nudged'
const NUDGE_MS = 8000

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((m) => m && (m.from === 'user' || m.from === 'bot') && typeof m.text === 'string') : []
  } catch {
    return []
  }
}

function saveHistory(items) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  } catch {
    /* storage blocked */
  }
}

function nudgeSeen() {
  try {
    return sessionStorage.getItem(NUDGE_KEY) === '1'
  } catch {
    return false
  }
}

function markNudgeSeen() {
  try {
    sessionStorage.setItem(NUDGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

export default function ChatGuide() {
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const bubbleRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const nudgeTimer = useRef(null)

  // One-time nudge, never auto-open. Marked seen when shown or on any interaction.
  useEffect(() => {
    if (nudgeSeen()) return
    nudgeTimer.current = setTimeout(() => {
      nudgeTimer.current = null
      if (nudgeSeen()) return
      markNudgeSeen()
      setNudge(true)
    }, NUDGE_MS)
    return () => clearTimeout(nudgeTimer.current)
  }, [])

  function dismissNudge() {
    clearTimeout(nudgeTimer.current)
    nudgeTimer.current = null
    setNudge(false)
    markNudgeSeen()
  }

  // Escape closes; Tab is trapped inside the panel.
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!panelRef.current.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    saveHistory(messages)
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages])

  function openPanel() {
    dismissNudge()
    setOpen(true)
  }

  function close() {
    setOpen(false)
    bubbleRef.current?.focus()
  }

  async function ask(text, intentId) {
    const q = text.trim()
    if (!q) return
    const answer = await getAnswer(q, intentId ? { intentId } : {})
    setMessages((m) => [...m, { from: 'user', text: q }, { from: 'bot', text: answer.text, actions: answer.actions }])
    setInput('')
  }

  async function runAction(a, idx) {
    if (a.type === 'scroll') {
      close()
      scrollTo(a.target)
    } else if (a.type === 'copy') {
      try {
        await navigator.clipboard.writeText(a.value)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 1500)
      } catch {
        /* clipboard blocked; value is visible in the message text */
      }
    } else if (a.type === 'link') {
      window.location.href = a.href
    }
  }

  return (
    <>
      {nudge && !open && (
        <button
          type="button"
          onClick={openPanel}
          className="theme-fade fixed bottom-[5.5rem] right-6 z-[60] rounded-2xl border border-line bg-surface px-4 py-2 text-sm shadow-lg"
        >
          {chat.nudge}
        </button>
      )}

      <button
        ref={bubbleRef}
        type="button"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        aria-expanded={open}
        aria-controls="chat-guide-panel"
        onClick={() => (open ? close() : openPanel())}
        className="fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primaryInk shadow-lg transition hover:bg-primaryHover"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          id="chat-guide-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Ask XionTechs"
          className="chat-panel theme-fade fixed z-[60] flex flex-col border border-line bg-surface shadow-2xl"
        >
          <header className="border-b border-line px-4 py-3">
            <p className="font-semibold">Ask XionTechs</p>
            <p className="text-xs text-muted">{chat.assistantLabel}</p>
          </header>

          <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="rounded-2xl rounded-tl-sm bg-primarySoft px-3 py-2 text-ink">{chat.greeting}</p>
            {messages.map((m, i) =>
              m.from === 'user' ? (
                <p key={i} className="ml-8 rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primaryInk">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="mr-4 space-y-2">
                  <p className="rounded-2xl rounded-tl-sm bg-primarySoft px-3 py-2 text-ink">{m.text}</p>
                  {m.actions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.actions.map((a, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => runAction(a, `${i}-${j}`)}
                          className="rounded-full border border-line px-3 py-1 text-xs font-medium text-primary transition hover:border-primary"
                        >
                          {copiedIdx === `${i}-${j}` ? 'Copied' : a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => ask(c.label, c.id)}
                className="rounded-full bg-primarySoft px-3 py-1 text-xs text-ink/80 transition hover:bg-primary hover:text-primaryInk"
              >
                {c.label}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-line px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="Type a question…"
              aria-label="Your question"
              className="flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primaryInk disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
