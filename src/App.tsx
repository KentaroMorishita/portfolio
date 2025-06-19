import React, { useEffect, useState, useRef } from "react"
import { RBox, Maybe } from "f-box-core"
import { useRBox } from "f-box-react"
import type { CommandContext, AvailableCommands } from "./commands"
import { commands, appendOutput } from "./commands"

// Cyberpunk background component
const CyberpunkBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <linearGradient id="cyberBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#000a1a", stopOpacity: 1 }}
            />
            <stop
              offset="25%"
              style={{ stopColor: "#0f0f2e", stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: "#1a0033", stopOpacity: 1 }}
            />
            <stop
              offset="75%"
              style={{ stopColor: "#001122", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#000000", stopOpacity: 1 }}
            />
          </linearGradient>

          <pattern
            id="cyberGrid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="#00ffaa"
              strokeWidth="0.4"
              opacity="0.3"
            />
            <path
              d="M 40 0 L 40 80 M 0 40 L 80 40"
              fill="none"
              stroke="#0088ff"
              strokeWidth="0.2"
              opacity="0.2"
            />
          </pattern>

          <pattern
            id="cyberCircuits"
            width="300"
            height="300"
            patternUnits="userSpaceOnUse"
          >
            <g stroke="#00ffaa" strokeWidth="1.5" fill="none" opacity="0.2">
              <path d="M0,75 L75,75 L75,150 L225,150 L225,225 L300,225" />
              <path d="M300,0 L225,0 L225,75 L150,75 L150,150 L0,150" />
              <circle cx="75" cy="75" r="4" fill="#00ffaa" />
              <circle cx="225" cy="150" r="3" fill="#0088ff" />
              <circle cx="150" cy="225" r="3" fill="#ff0088" />
            </g>
          </pattern>

          <filter id="cyberGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#cyberBg)" />
        <rect width="100%" height="100%" fill="url(#cyberGrid)" />
        <rect
          width="100%"
          height="100%"
          fill="url(#cyberCircuits)"
          opacity="0.5"
        />

        {/* Animated scanning lines */}
        <rect
          width="100%"
          height="3"
          fill="#00ffaa"
          opacity="0.6"
          filter="url(#cyberGlow)"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,-100; 0,100vh"
            dur="6s"
            repeatCount="indefinite"
          />
        </rect>
        <rect
          width="100%"
          height="2"
          fill="#0088ff"
          opacity="0.4"
          filter="url(#cyberGlow)"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,-50; 0,100vh"
            dur="8s"
            repeatCount="indefinite"
          />
        </rect>

        {/* Corner accent lines */}
        <g filter="url(#cyberGlow)">
          <path
            d="M 0 0 L 150 0 L 150 3 L 3 3 L 3 150 L 0 150 Z"
            fill="#00ffaa"
            opacity="0.4"
          />
          <path
            d="M 100vw 0 L calc(100vw - 150px) 0 L calc(100vw - 150px) 3 L calc(100vw - 3px) 3 L calc(100vw - 3px) 150 L 100vw 150 Z"
            fill="#0088ff"
            opacity="0.4"
          />
          <path
            d="M 0 100vh L 150 100vh L 150 calc(100vh - 3px) L 3 calc(100vh - 3px) L 3 calc(100vh - 150px) L 0 calc(100vh - 150px) Z"
            fill="#ff0088"
            opacity="0.4"
          />
          <path
            d="M 100vw 100vh L calc(100vw - 150px) 100vh L calc(100vw - 150px) calc(100vh - 3px) L calc(100vw - 3px) calc(100vh - 3px) L calc(100vw - 3px) calc(100vh - 150px) L 100vw calc(100vh - 150px) Z"
            fill="#00ffaa"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  )
}

interface Terminal {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  isMaximized: boolean
  previousSize: { width: number; height: number }
  previousPosition: { x: number; y: number }
  context: CommandContext
  zIndex: number
}

let terminalIdCounter = 0

const createNewTerminal = (offsetX = 0, offsetY = 0): Terminal => {
  terminalIdCounter++
  const welcomeMessage =
    terminalIdCounter === 1
      ? [
          "╭─────────────────────────────────────────────────────╮",
          "│             Welcome to CLI Portfolio!               │",
          "│                                                     │",
          "│  Try these commands to explore:                     │",
          "│  • whoami    - View detailed profile                │",
          "│  • projects  - See my projects                      │",
          "│  • help      - All available commands               │",
          "╰─────────────────────────────────────────────────────╯",
        ]
      : [`Welcome to Terminal ${terminalIdCounter}! Type 'help' for commands.`]

  return {
    id: `terminal-${terminalIdCounter}`,
    position: { x: offsetX, y: offsetY },
    size: { width: 1000, height: 700 },
    isMinimized: false,
    isMaximized: false,
    previousSize: { width: 1000, height: 700 },
    previousPosition: { x: offsetX, y: offsetY },
    context: {
      currentPathBox: RBox.pack<string[]>(["~"]),
      outputBox: RBox.pack<string[]>(welcomeMessage),
    },
    zIndex: terminalIdCounter,
  }
}

const TerminalWindow: React.FC<{
  terminal: Terminal
  onUpdate: (terminal: Terminal) => void
  onClose: () => void
  onFocus: () => void
}> = ({ terminal, onUpdate, onClose, onFocus }) => {
  const [currentPath] = useRBox(terminal.context.currentPathBox)
  const [output] = useRBox(terminal.context.outputBox)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentInput, setCurrentInput] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeDirection, setResizeDirection] = useState<string>("")
  const outputEndRef = useRef<HTMLDivElement>(null)

  const handleCommand = (_input: string) => {
    const input = _input.trim()
    if (!input) return

    setCommandHistory((prev) => [...prev, input])
    setHistoryIndex(-1)
    setCurrentInput("")

    // コマンドプロンプトを出力に追加
    appendOutput(
      terminal.context.outputBox,
      `${currentPath.join("/")} $ ${input}`
    )

    const [cmd, arg] = input.split(" ") as [cmd: AvailableCommands, arg: string]
    Maybe.pack(commands[cmd]).match(
      (cmd) => cmd(terminal.context, arg),
      () =>
        appendOutput(
          terminal.context.outputBox,
          `Unknown command: ${cmd}. Type 'help' for available commands.`
        )
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget

    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleCommand("clear")
      return
    }

    if (e.key === "Enter") {
      handleCommand(input.value)
      input.value = ""
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        input.value = commandHistory[newIndex]
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          input.value = currentInput
        } else {
          setHistoryIndex(newIndex)
          input.value = commandHistory[newIndex]
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      const availableCommands = Object.keys(commands)
      const currentValue = input.value.toLowerCase()
      const matches = availableCommands.filter((cmd) =>
        cmd.toLowerCase().startsWith(currentValue)
      )

      if (matches.length === 1) {
        input.value = matches[0]
      } else if (matches.length > 1) {
        appendOutput(terminal.context.outputBox, matches.join("  "))
      }
    } else {
      if (historyIndex !== -1) {
        setHistoryIndex(-1)
      }
      setCurrentInput(input.value + e.key)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus()

    const target = e.target as HTMLElement

    // 出力エリアでのクリックは何もしない（テキスト選択を許可）
    if (target.closest(".output-area")) {
      return
    }

    // ウィンドウクリック時にコマンドラインにフォーカス
    setTimeout(() => {
      const input = document.getElementById(`console-${terminal.id}`)
      if (input && !terminal.isMinimized) {
        input.focus()
      }
    }, 0)

    if (target.closest(".title-bar") && !target.closest(".window-button")) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - terminal.position.x,
        y: e.clientY - terminal.position.y,
      })
    } else if (target.closest(".resize-handle")) {
      setIsResizing(true)
      const direction =
        target.closest(".resize-handle")?.getAttribute("data-direction") || "se"
      setResizeDirection(direction)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        onUpdate({
          ...terminal,
          position: {
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
          },
        })
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        let newWidth = terminal.size.width
        let newHeight = terminal.size.height
        let newX = terminal.position.x
        const newY = terminal.position.y

        switch (resizeDirection) {
          case "e": // 右
            newWidth = Math.max(400, terminal.size.width + deltaX)
            break
          case "w": // 左
            newWidth = Math.max(400, terminal.size.width - deltaX)
            newX = terminal.position.x + deltaX
            break
          case "s": // 下
            newHeight = Math.max(300, terminal.size.height + deltaY)
            break
          case "se": // 右下
            newWidth = Math.max(400, terminal.size.width + deltaX)
            newHeight = Math.max(300, terminal.size.height + deltaY)
            break
          case "sw": // 左下
            newWidth = Math.max(400, terminal.size.width - deltaX)
            newHeight = Math.max(300, terminal.size.height + deltaY)
            newX = terminal.position.x + deltaX
            break
        }

        onUpdate({
          ...terminal,
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY },
        })

        setDragStart({ x: e.clientX, y: e.clientY })
      }
    },
    [isDragging, isResizing, dragStart, resizeDirection, terminal, onUpdate]
  )

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection("")
  }, [])

  const handleCloseWindow = () => {
    onClose()
  }

  const handleMinimizeWindow = () => {
    onUpdate({
      ...terminal,
      isMinimized: !terminal.isMinimized,
    })
  }

  const handleMaximizeWindow = () => {
    if (terminal.isMaximized) {
      onUpdate({
        ...terminal,
        size: terminal.previousSize,
        position: terminal.previousPosition,
        isMaximized: false,
      })
    } else {
      onUpdate({
        ...terminal,
        previousSize: terminal.size,
        previousPosition: terminal.position,
        size: { width: window.innerWidth, height: window.innerHeight },
        position: { x: 0, y: 0 },
        isMaximized: true,
      })
    }
  }

  const handleDoubleClick = () => {
    if (terminal.isMinimized) {
      onUpdate({
        ...terminal,
        isMinimized: false,
      })
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      })
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [output])

  return (
    <div
      className={`absolute bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col opacity-95 text-sm overflow-hidden ${
        terminal.isMinimized
          ? "transition-all duration-300 cursor-pointer select-none"
          : ""
      }`}
      style={{
        left: `calc(50% + ${terminal.position.x}px)`,
        top: `calc(50% + ${terminal.position.y}px)`,
        width: `${terminal.size.width}px`,
        height: `${terminal.size.height}px`,
        transform: `translate(-50%, -50%) ${
          terminal.isMinimized ? "scale(0.1)" : "scale(1)"
        }`,
        minWidth: "400px",
        minHeight: "300px",
        zIndex: terminal.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="title-bar bg-slate-800 h-8 min-h-8 flex items-center justify-between px-4 rounded-t-lg cursor-move select-none border-b border-slate-600">
        <div className="flex space-x-2">
          <span
            className="window-button w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer flex items-center justify-center group"
            onClick={(e) => {
              e.stopPropagation()
              handleCloseWindow()
            }}
          >
            <span className="text-xs text-red-900 opacity-0 group-hover:opacity-100">
              ✕
            </span>
          </span>
          <span
            className="window-button w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 cursor-pointer flex items-center justify-center group"
            onClick={(e) => {
              e.stopPropagation()
              handleMinimizeWindow()
            }}
          >
            <span className="text-xs text-yellow-900 opacity-0 group-hover:opacity-100">
              ─
            </span>
          </span>
          <span
            className="window-button w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 cursor-pointer flex items-center justify-center group"
            onClick={(e) => {
              e.stopPropagation()
              handleMaximizeWindow()
            }}
          >
            <span className="text-xs text-green-900 opacity-0 group-hover:opacity-100">
              ▢
            </span>
          </span>
        </div>
        <span className="text-slate-400 text-xs font-medium">
          Terminal {terminal.id.split("-")[1]}
        </span>
        <div className="w-4"></div>
      </div>

      {!terminal.isMinimized && (
        <>
          <div className="output-area bg-slate-900 text-slate-200 font-mono p-4 overflow-y-auto whitespace-pre-wrap select-text">
            {output.map((line: string, index: number) => {
              const getLineColor = (text: string) => {
                if (text.includes(" $ ")) {
                  return "text-slate-100 font-medium"
                } else if (
                  text.includes("👨‍💻") ||
                  text.includes("🚀") ||
                  text.includes("🔗") ||
                  text.includes("🎨")
                ) {
                  return "text-sky-300"
                } else if (
                  text.includes("Error") ||
                  text.includes("error") ||
                  text.includes("No such file")
                ) {
                  return "text-rose-400"
                } else if (
                  text.includes("Welcome") ||
                  text.includes("Available commands")
                ) {
                  return "text-amber-300"
                } else if (
                  text.includes("kentaromorishita@portfolio") ||
                  text.includes("OS:") ||
                  text.includes("Host:")
                ) {
                  return "text-cyan-300"
                } else if (
                  text.startsWith("│") ||
                  text.startsWith("╭") ||
                  text.startsWith("╰") ||
                  text.startsWith("├")
                ) {
                  return "text-violet-300"
                }
                return "text-slate-200"
              }

              const renderLineWithLinks = (text: string) => {
                const urlRegex = /(https?:\/\/[^\s]+)/g
                const parts = text.split(urlRegex)

                return parts.map((part, partIndex) => {
                  if (urlRegex.test(part)) {
                    return (
                      <a
                        key={partIndex}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-300 hover:text-sky-100 underline hover:no-underline cursor-pointer transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {part}
                      </a>
                    )
                  }
                  return part
                })
              }

              return (
                <div key={index} className={getLineColor(line)}>
                  {renderLineWithLinks(line)}
                </div>
              )
            })}
            <div ref={outputEndRef} />
          </div>
          <div className="flex-1 bg-slate-900 text-slate-200 font-mono p-4 select-text relative border-t border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium">
                {currentTime.toLocaleTimeString()} | Commands:{" "}
                {commandHistory.length}
              </span>
            </div>
            <span className="text-sky-300 font-medium">
              {currentPath.join("/")}
            </span>
            <span className="text-amber-300 font-bold"> $ </span>
            <input
              autoFocus={!terminal.isMinimized}
              type="text"
              id={`console-${terminal.id}`}
              className="bg-slate-900 text-slate-200 border-none outline-none w-3/4 placeholder-slate-500"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* リサイズハンドル群 */}
          <div
            className="resize-handle absolute top-0 right-0 w-1 h-full cursor-e-resize hover:bg-sky-500 opacity-0 hover:opacity-50"
            data-direction="e"
          />
          <div
            className="resize-handle absolute top-0 left-0 w-1 h-full cursor-w-resize hover:bg-sky-500 opacity-0 hover:opacity-50"
            data-direction="w"
          />
          <div
            className="resize-handle absolute bottom-0 left-0 w-full h-1 cursor-s-resize hover:bg-sky-500 opacity-0 hover:opacity-50"
            data-direction="s"
          />
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-slate-600 opacity-50 hover:opacity-100"
            data-direction="se"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M12 4l4 4-4 4M8 4l4 4-4 4"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
              />
            </svg>
          </div>
          <div
            className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-slate-600 opacity-50 hover:opacity-100"
            data-direction="sw"
          />
        </>
      )}
    </div>
  )
}

const App: React.FC = () => {
  const [terminals, setTerminals] = useState<Terminal[]>(() => {
    // 初期ターミナルを作成
    terminalIdCounter = 0 // カウンターをリセット
    return [createNewTerminal()]
  })
  const [maxZIndex, setMaxZIndex] = useState(1)

  const updateTerminal = (updatedTerminal: Terminal) => {
    setTerminals((prev) =>
      prev.map((terminal) =>
        terminal.id === updatedTerminal.id ? updatedTerminal : terminal
      )
    )
  }

  const closeTerminal = (terminalId: string) => {
    setTerminals((prev) =>
      prev.filter((terminal) => terminal.id !== terminalId)
    )
  }

  const focusTerminal = (terminalId: string) => {
    const newZIndex = maxZIndex + 1
    setMaxZIndex(newZIndex)
    setTerminals((prev) =>
      prev.map((terminal) =>
        terminal.id === terminalId
          ? { ...terminal, zIndex: newZIndex }
          : terminal
      )
    )
  }

  const createNewTerminalWindow = () => {
    const offset = terminals.length * 30
    const newTerminal = createNewTerminal(offset, offset)
    newTerminal.zIndex = maxZIndex + 1
    setMaxZIndex(newTerminal.zIndex)
    setTerminals((prev) => [...prev, newTerminal])
  }

  return (
    <div className="min-h-screen bg-cover bg-center relative">
      <CyberpunkBackground />
      {/* デスクトップアイコン */}
      <div
        className="absolute bottom-4 left-4 w-16 h-16 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors shadow-lg"
        onDoubleClick={createNewTerminalWindow}
      >
        <div className="text-sky-300 text-2xl">⚡</div>
      </div>

      {/* ターミナルウィンドウ群 */}
      {terminals.map((terminal) => (
        <TerminalWindow
          key={terminal.id}
          terminal={terminal}
          onUpdate={updateTerminal}
          onClose={() => closeTerminal(terminal.id)}
          onFocus={() => focusTerminal(terminal.id)}
        />
      ))}
    </div>
  )
}

export default App
