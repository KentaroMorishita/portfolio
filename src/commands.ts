import { RBox } from "f-box-core"
import help from "./assets/help.json" assert { type: "json" }
import profile from "./assets/profile.json" assert { type: "json" }
import projects from "./assets/projects.json" assert { type: "json" }
import type { FileNode } from "./fileSystem"
import { fileSystem } from "./fileSystem"

export type Commands = {
  ls: (ctx: CommandContext, arg?: string) => void
  cd: (ctx: CommandContext, arg?: string) => void
  cat: (ctx: CommandContext, arg?: string) => void
  help: (ctx: CommandContext) => void
  clear: (ctx: CommandContext) => void
  whoami: (ctx: CommandContext) => void
  projects: (ctx: CommandContext) => void
  la: (ctx: CommandContext) => void
  status: (ctx: CommandContext) => void
  exec: (ctx: CommandContext, arg?: string) => void
}

export type AvailableCommands = keyof Commands

export type GameStats = {
  level: number
  experience: number
  gold: number
  items: string[]
  achievements: {
    secretFinder: boolean
    treasureHunter: boolean
    riddleSolver: boolean
    spellCaster: boolean
  }
  visitedFiles: Set<string>
}

export type CommandContext = {
  currentPathBox: RBox<string[]>
  outputBox: RBox<string[]>
  gameStatsBox: RBox<GameStats>
}

export const getCurrentDirectory = (currentPath: string[]): FileNode =>
  currentPath
    .slice(1)
    .reduce<FileNode>(
      (currentDir, dir) => currentDir.contents![dir],
      fileSystem["~"]
    )

// Unified path resolution function that handles ".." properly
export const resolvePath = (
  currentPath: string[],
  targetPath: string
): string[] => {
  // Start with current path (excluding "~" at index 0)
  let resolvedPath = [...currentPath.slice(1)]

  // Handle absolute vs relative paths
  if (targetPath.startsWith("/")) {
    // Absolute path - start from root
    resolvedPath = []
    targetPath = targetPath.substring(1)
  }

  // Split path and filter out empty segments
  const pathParts = targetPath.split("/").filter((part) => part !== "")

  // Process each path segment
  for (const part of pathParts) {
    if (part === "..") {
      // Go up one directory (but not above root)
      if (resolvedPath.length > 0) {
        resolvedPath.pop()
      }
    } else if (part !== ".") {
      // Regular directory name (ignore "." current directory)
      resolvedPath.push(part)
    }
  }

  // Return full path including "~"
  return ["~", ...resolvedPath]
}

// Get directory node from resolved path
export const getDirectoryFromPath = (
  resolvedPath: string[]
): FileNode | null => {
  try {
    return resolvedPath.slice(1).reduce<FileNode>((currentDir, dir) => {
      if (!currentDir.contents || !currentDir.contents[dir]) {
        throw new Error("Directory not found")
      }
      return currentDir.contents[dir]
    }, fileSystem["~"])
  } catch {
    return null
  }
}

export const appendOutput = (
  outputBox: RBox<string[]>,
  message: string | string[]
) => {
  outputBox.setValue((prev) => [...prev, ...[message].flat()])
}

export const appendOutputWithClass = (
  outputBox: RBox<string[]>,
  message: string | string[],
  className?: string
) => {
  const lines = [message].flat()
  const wrappedLines = className
    ? lines.map((line) => {
        // ASCIIアート（等幅フォント必要）の判定
        const isASCIIArt =
          line.includes("___") ||
          line.includes("ASCII") ||
          /^\s*[|/\\]+\s*$/.test(line)

        if (isASCIIArt) {
          return `<span class="ascii-art">${line}</span>`
        } else {
          return `<span class="${className}">${line}</span>`
        }
      })
    : lines
  outputBox.setValue((prev) => [...prev, ...wrappedLines])
}

export const appendOutputWithTyping = (
  outputBox: RBox<string[]>,
  message: string | string[],
  delay: number = 30
) => {
  const lines = [message].flat()
  let currentLineIndex = 0
  let currentCharIndex = 0

  const typeNextChar = () => {
    if (currentLineIndex >= lines.length) return

    const currentLine = lines[currentLineIndex]
    const currentText = currentLine.slice(0, currentCharIndex + 1)

    outputBox.setValue((prev) => {
      const newOutput = [...prev]
      if (currentCharIndex === 0) {
        newOutput.push(currentText)
      } else {
        newOutput[newOutput.length - 1] = currentText
      }
      return newOutput
    })

    currentCharIndex++

    if (currentCharIndex >= currentLine.length) {
      currentLineIndex++
      currentCharIndex = 0
      setTimeout(typeNextChar, delay * 2) // 行間は少し長めに
    } else {
      setTimeout(typeNextChar, delay)
    }
  }

  typeNextChar()
}

export const listDirectory = (
  { currentPathBox, outputBox }: CommandContext,
  arg?: string
) => {
  const dir = getCurrentDirectory(currentPathBox.getValue())
  const contents = dir.contents || {}

  // オプション解析
  let showHidden = false
  let showDetails = false

  if (arg) {
    // -で始まるオプションの場合
    if (arg.startsWith("-")) {
      const options = arg.slice(1) // -を除去
      showHidden = options.includes("a")
      showDetails = options.includes("l")
    } else {
      // ディレクトリ名が指定された場合（今回は未対応）
      appendOutput(outputBox, `ls: ${arg}: directory listing not implemented`)
      return
    }
  }

  // ファイル一覧の取得
  let entries = Object.entries(contents)

  // 隠しファイルのフィルタリング
  if (!showHidden) {
    entries = entries.filter(([name]) => !name.startsWith("."))
  }

  if (showDetails) {
    // 詳細表示（-l オプション）
    const details = entries.map(([name, item]) => {
      const type = item.type === "directory" ? "d" : "-"
      const permissions = item.permissions.slice(1)
      const size = item.size.padStart(8)
      return `${type}${permissions} 1 morishita morishita ${size} ${name}`
    })
    appendOutput(outputBox, details)
  } else {
    // シンプル表示
    const fileNames = entries.map(([name, item]) => {
      const separator = item.type === "directory" ? "/" : ""
      return `${name}${separator}`
    })

    // 複数列で表示
    appendOutput(outputBox, [fileNames.join("  ")])
  }
}

export const changeDirectory = (
  { currentPathBox, outputBox }: CommandContext,
  arg?: string
) => {
  if (!arg || arg === "~") {
    currentPathBox.setValue(() => ["~"])
    return
  }

  // Use unified path resolution
  const resolvedPath = resolvePath(currentPathBox.getValue(), arg)
  const targetDir = getDirectoryFromPath(resolvedPath)

  if (!targetDir || targetDir.type !== "directory") {
    appendOutput(outputBox, `cd: ${arg}: No such file or directory`)
    return
  }

  currentPathBox.setValue(() => resolvedPath)
}

export const readFile = (
  { currentPathBox, outputBox, gameStatsBox }: CommandContext,
  arg?: string
) => {
  if (!arg) {
    appendOutput(outputBox, "cat: missing argument")
    return
  }

  let target: FileNode | undefined
  let actualFilePath = arg

  // パス解析: ディレクトリ/ファイル形式の場合
  if (arg.includes("/")) {
    const pathParts = arg.split("/")
    const fileName = pathParts.pop()!
    const dirPath = pathParts.join("/")

    // Use unified path resolution for directory part
    const resolvedDirPath = resolvePath(currentPathBox.getValue(), dirPath)
    const targetDir = getDirectoryFromPath(resolvedDirPath)

    if (!targetDir) {
      appendOutput(outputBox, `cat: ${arg}: No such file or directory`)
      return
    }

    if (targetDir.type !== "directory") {
      appendOutput(outputBox, `cat: ${arg}: Not a directory`)
      return
    }

    // 最終的なファイルを取得
    target = targetDir.contents?.[fileName]
    actualFilePath = fileName
  } else {
    // 単純なファイル名の場合
    const dir = getCurrentDirectory(currentPathBox.getValue())
    target = dir?.contents?.[arg]
  }

  if (!target) {
    appendOutput(outputBox, `cat: ${arg}: No such file`)
    return
  }

  if (target.type === "directory") {
    appendOutput(outputBox, `cat: ${arg}: Is a directory`)
    return
  }
  // ヘッダーは通常フォント
  appendOutput(outputBox, [`Displaying contents of ${arg}`])

  // ファイル内容はゲーム風フォント
  if (target.body && target.body.length > 0) {
    appendOutputWithClass(outputBox, target.body, "cat-output japanese-content")
  }

  // ゲームステータス更新ロジック
  const currentPath = currentPathBox.getValue().join("/")
  const filePath = `${currentPath}/${arg}`

  gameStatsBox.setValue((prevStats) => {
    const newStats = { ...prevStats }

    // 新しいファイルを読んだ場合は経験値獲得
    if (!newStats.visitedFiles.has(filePath)) {
      // dungeonディレクトリ内のファイルのみカウント（.shファイルはexec時のみ、congratulations.txtは除外）
      if (
        filePath.includes("/dungeon/") &&
        !actualFilePath.endsWith(".sh") &&
        actualFilePath !== "congratulations.txt"
      ) {
        newStats.visitedFiles.add(filePath)
        newStats.experience += 10

        // レベルアップ判定
        const newLevel = Math.floor(newStats.experience / 100) + 1
        if (newLevel > newStats.level) {
          newStats.level = newLevel
          appendOutput(outputBox, [
            "",
            "🎉 レベルアップ！ 新しいレベル: " + newLevel,
          ])
        }
      }

      // 全ファイル探索完了チェック（dungeonディレクトリ内の10ファイル）
      const totalGameFiles = 10 // dungeonディレクトリ内の探索ファイル数
      if (
        newStats.visitedFiles.size >= totalGameFiles &&
        actualFilePath !== "congratulations.txt"
      ) {
        // congratulations.txtをfileSystemに動的に追加
        if (
          !fileSystem["~"].contents!["dungeon"].contents!["congratulations.txt"]
        ) {
          fileSystem["~"].contents!["dungeon"].contents![
            "congratulations.txt"
          ] = {
            type: "file",
            permissions: "-r--r--r--",
            size: "1KB",
            body: [
              "🎉✨ ゲームクリア！ ✨🎉",
              "",
              "　　　おめでとう、真の探索者よ！",
              "",
              "あなたはデジタルダンジョンの全ての秘密を",
              "解き明かし、すべてのファイルを探索した！",
              "",
              "🏆 達成した偉業:",
              "─────────────────────",
              "• 全ファイル探索完了",
              "• 宝物庫の財宝発見",
              "• 古代ドラゴンの謎解き",
              "• 隠しファイルの発見",
              "• 魔法スクリプトの習得",
              "",
              "🎮 最終ステータス確認: status",
              "",
              "君はもう立派なLinuxマスターだ！",
              "この冒険で学んだコマンドやスキルを",
              "実際の開発でも活用してくれ！",
              "",
              "🌟 ファイナルメッセージ:",
              "「真の探索は、知識の果てにではなく、",
              " 未知への好奇心の中にある」",
              "",
              "デジタルダンジョンアドベンチャー",
              "制作者: Kentaro Morishita",
              "",
              "ご冒険ありがとうございました！ 🗡️✨🏰",
            ],
          }
        }

        setTimeout(() => {
          appendOutput(outputBox, [
            "",
            "🌟✨ 全ファイル探索完了！ ✨🌟",
            "",
            "突然、ダンジョンの奥から光が差し込んだ...",
            "新しいファイルが現れた: congratulations.txt",
            "💡 ダンジョンディレクトリで確認してみよう！",
          ])
        }, 1000)
      }
    }

    // 特定ファイルでの特別報酬
    if (actualFilePath === "gold_chest.txt") {
      newStats.gold += 500
      newStats.items.push("ダイヤモンド", "魔法の剣")
      newStats.achievements.treasureHunter = true
      appendOutput(outputBox, [
        "",
        "💰 500ゴールド獲得！",
        "🎮 実績解除: 宝物ハンター",
      ])
    }

    if (actualFilePath === ".hidden_scroll") {
      newStats.achievements.secretFinder = true
      newStats.experience += 100
      if (!newStats.items.includes("古代の巻物")) {
        newStats.items.push("古代の巻物")
      }
      appendOutput(outputBox, [
        "",
        "🎮 実績解除: 秘密の発見者",
        "⭐ 100経験値獲得！",
        "💎 古代の巻物を獲得！",
      ])
    }

    if (actualFilePath === "answer.txt") {
      newStats.achievements.riddleSolver = true
      newStats.experience += 50
      appendOutput(outputBox, [
        "",
        "🎮 実績解除: 謎解き師",
        "🧠 50経験値獲得！",
      ])
    }

    if (actualFilePath.includes("spell")) {
      newStats.achievements.spellCaster = true
      appendOutput(outputBox, ["", "🎮 実績解除: 魔法使い"])
    }

    if (actualFilePath === "mysterious_orb") {
      newStats.experience += 30
      if (!newStats.items.includes("神秘のオーブ")) {
        newStats.items.push("神秘のオーブ")
      }
      appendOutput(outputBox, [
        "",
        "⭐ 30経験値獲得！",
        "🔮 神秘のオーブを獲得！",
      ])
    }

    if (actualFilePath === "goblin.txt") {
      newStats.experience += 10
      appendOutput(outputBox, [
        "",
        "📚 Unixの隠しファイルについて学べた！",
        "⭐ 10経験値獲得！",
      ])
    }

    if (actualFilePath === "congratulations.txt") {
      newStats.experience += 100
      newStats.gold += 1000
      if (!newStats.items.includes("ダンジョンマスターの証")) {
        newStats.items.push("ダンジョンマスターの証")
      }
      // 全実績をクリアにする
      newStats.achievements.secretFinder = true
      newStats.achievements.treasureHunter = true
      newStats.achievements.riddleSolver = true
      newStats.achievements.spellCaster = true

      appendOutput(outputBox, [
        "",
        "🎊 ゲームクリア報酬! 🎊",
        "👑 ダンジョンマスターの証を獲得！",
        "💰 1000ゴールド獲得！",
        "⭐ 100経験値獲得！",
        "🏆 全実績解除！",
      ])
    }

    return newStats
  })
}

export const displayHelp = (ctx: CommandContext) =>
  appendOutput(ctx.outputBox, help as string[])
export const clearOutput = (ctx: CommandContext) =>
  ctx.outputBox.setValue(() => [])

export const displayWhoAmI = (ctx: CommandContext) => {
  const profileData = profile

  // 実際の行の内容を作成して最大幅を計算
  const contentLines = [
    ` Name:     ${profileData.name} `,
    ` Age:      ${profileData.age} `,
    ` Job:      ${profileData.job} `,
    ` GitHub:   ${profileData.github} `,
    ` Qiita:    ${profileData.qiita} `,
    ` X:        ${profileData.sns.x} `,
    ` f-box-core:  ${profileData.ownWorks["f-box-core"]} `,
    ` f-box-react: ${profileData.ownWorks["f-box-react"]} `,
    ` f-box-docs:  ${profileData.ownWorks["f-box-docs"]} `,
    ` seseragi:    ${profileData.ownWorks["seseragi"]} `,
    ` ${profileData.hobbies.join(" • ")} `,
    " PROFILE INFO ",
    " LINKS ",
    " OWN WORKS ",
    " HOBBIES ",
  ]

  // 最大の行の幅を取得
  const maxContentWidth = Math.max(...contentLines.map((line) => line.length))
  const borderLine = "─".repeat(maxContentWidth)

  // センタリング用のヘルパー関数
  const centerText = (text: string) => {
    const padding = Math.floor((maxContentWidth - text.length) / 2)
    return text.padStart(text.length + padding).padEnd(maxContentWidth)
  }

  const output = [
    `╭${borderLine}╮`,
    `│${centerText("PROFILE INFO")}│`,
    `├${borderLine}┤`,
    `│${` Name:     ${profileData.name}`.padEnd(maxContentWidth)}│`,
    `│${` Age:      ${profileData.age}`.padEnd(maxContentWidth)}│`,
    `│${` Job:      ${profileData.job}`.padEnd(maxContentWidth)}│`,
    `├${borderLine}┤`,
    `│${centerText("LINKS")}│`,
    `├${borderLine}┤`,
    `│${` GitHub:   ${profileData.github}`.padEnd(maxContentWidth)}│`,
    `│${` Qiita:    ${profileData.qiita}`.padEnd(maxContentWidth)}│`,
    `│${` X:        ${profileData.sns.x}`.padEnd(maxContentWidth)}│`,
    `├${borderLine}┤`,
    `│${centerText("OWN WORKS")}│`,
    `├${borderLine}┤`,
    `│${` f-box-core:  ${profileData.ownWorks["f-box-core"]}`.padEnd(
      maxContentWidth
    )}│`,
    `│${` f-box-react: ${profileData.ownWorks["f-box-react"]}`.padEnd(
      maxContentWidth
    )}│`,
    `│${` f-box-docs:  ${profileData.ownWorks["f-box-docs"]}`.padEnd(
      maxContentWidth
    )}│`,
    `│${` seseragi:    ${profileData.ownWorks["seseragi"]}`.padEnd(
      maxContentWidth
    )}│`,
    `├${borderLine}┤`,
    `│${centerText("HOBBIES")}│`,
    `├${borderLine}┤`,
    `│${` ${profileData.hobbies.join(" • ")}`.padEnd(maxContentWidth)}│`,
    `╰${borderLine}╯`,
  ]
  appendOutputWithTyping(ctx.outputBox, output, 5)
}

export const displayProjects = (ctx: CommandContext) => {
  const projectsData = projects
  const output = [
    "╭─────────────────────────────────────────────────────╮",
    "│                     PROJECTS                        │",
    "╰─────────────────────────────────────────────────────╯",
    "",
  ]

  projectsData.forEach((project, index) => {
    output.push(
      `* ${project.name}`,
      `   ${project.description}`,
      `   Tech: ${project.tech.join(", ")}`,
      `   Status: ${project.status}`,
      ""
    )

    Object.entries(project.links).forEach(([key, url]) => {
      output.push(`   ${key}: ${url}`)
    })

    if (index < projectsData.length - 1) {
      output.push("", "─".repeat(65), "")
    }
  })

  appendOutput(ctx.outputBox, output)
}

const listDirectoryLongAll = (ctx: CommandContext) => {
  const currentDir = getCurrentDirectory(ctx.currentPathBox.getValue())
  const files = Object.entries(currentDir.contents || {})

  const formatFile = (name: string, file: FileNode): string => {
    const type = file.type === "directory" ? "d" : "-"
    const permissions = file.permissions.slice(1)
    const size = file.size.padStart(8)
    return `${type}${permissions} 1 morishita morishita ${size} ${name}`
  }

  const output = files.map(([name, file]) => formatFile(name, file))
  appendOutput(ctx.outputBox, output)
}

const displayStatus = (ctx: CommandContext) => {
  const stats = ctx.gameStatsBox.getValue()

  const achievementsList = [
    stats.achievements.secretFinder ? "[✓] 秘密の発見者" : "[ ] 秘密の発見者",
    stats.achievements.treasureHunter ? "[✓] 宝物ハンター" : "[ ] 宝物ハンター",
    stats.achievements.riddleSolver ? "[✓] 謎解き師" : "[ ] 謎解き師",
    stats.achievements.spellCaster ? "[✓] 魔法使い" : "[ ] 魔法使い",
  ]

  const totalGameFiles = 10 // dungeonディレクトリ内の探索ファイル数
  const completionRate = Math.round(
    (stats.visitedFiles.size / totalGameFiles) * 100
  )

  const output = [
    "📊 冒険者ステータス 📊",
    "",
    "基本情報:",
    "────────────────────",
    `レベル: ${stats.level}`,
    `経験値: ${stats.experience} XP`,
    `ゴールド: ${stats.gold} G`,
    `アイテム: ${stats.items.length > 0 ? stats.items.join(", ") : "なし"}`,
    "",
    "探索進捗:",
    "────────────",
    `ファイル探索: ${stats.visitedFiles.size}/${totalGameFiles} (${completionRate}%)`,
    stats.visitedFiles.size >= totalGameFiles
      ? "🎉 全ファイル探索完了！"
      : "🔍 まだ未発見のファイルがある...",
    "",
    "実績:",
    "────────────",
    ...achievementsList,
    "",
    stats.visitedFiles.size >= totalGameFiles
      ? "おめでとう！全てのファイルを探索した！"
      : "より多くのファイルを探索して経験値を稼ごう！",
  ]

  appendOutputWithClass(ctx.outputBox, output, "cat-output japanese-content")
}

const executeScript = (
  { currentPathBox, outputBox, gameStatsBox }: CommandContext,
  arg?: string
) => {
  if (!arg) {
    appendOutput(outputBox, "exec: missing argument")
    return
  }

  let target: FileNode | undefined
  let actualFilePath = arg

  // パス解析: ディレクトリ/ファイル形式の場合
  if (arg.includes("/")) {
    const pathParts = arg.split("/")
    const fileName = pathParts.pop()!
    const dirPath = pathParts.join("/")

    // Use unified path resolution for directory part
    const resolvedDirPath = resolvePath(currentPathBox.getValue(), dirPath)
    const targetDir = getDirectoryFromPath(resolvedDirPath)

    if (!targetDir) {
      appendOutput(outputBox, `exec: ${arg}: No such file or directory`)
      return
    }

    if (targetDir.type !== "directory") {
      appendOutput(outputBox, `exec: ${arg}: Not a directory`)
      return
    }

    // 最終的なファイルを取得
    target = targetDir.contents?.[fileName]
    actualFilePath = fileName
  } else {
    // 単純なファイル名の場合
    const dir = getCurrentDirectory(currentPathBox.getValue())
    target = dir?.contents?.[arg]
  }

  if (!target) {
    appendOutput(outputBox, `exec: ${arg}: No such file`)
    return
  }

  if (target.type === "directory") {
    appendOutput(outputBox, `exec: ${arg}: Is a directory`)
    return
  }

  // 実行権限チェック
  if (!target.permissions.includes("x")) {
    appendOutput(outputBox, `exec: ${arg}: Permission denied`)
    return
  }

  // .shファイルかチェック
  if (!actualFilePath.endsWith(".sh")) {
    appendOutput(outputBox, `exec: ${arg}: Not an executable script`)
    return
  }

  appendOutput(outputBox, [`Executing ${arg}...`])
  appendOutput(outputBox, [""])

  // 魔法ファイル実行時のゲームステート更新
  const currentPath = currentPathBox.getValue().join("/")
  const filePath = `${currentPath}/${arg}`

  gameStatsBox.setValue((prevStats) => {
    const newStats = { ...prevStats }

    // .shファイルを実行した場合のみカウント
    if (
      !newStats.visitedFiles.has(filePath) &&
      filePath.includes("/dungeon/") &&
      actualFilePath.endsWith(".sh")
    ) {
      newStats.visitedFiles.add(filePath)
      newStats.experience += 10

      // レベルアップ判定
      const newLevel = Math.floor(newStats.experience / 100) + 1
      if (newLevel > newStats.level) {
        newStats.level = newLevel
        appendOutput(outputBox, [
          "",
          "🎉 レベルアップ！ 新しいレベル: " + newLevel,
        ])
      }

      // 全ファイル探索完了チェック
      const totalGameFiles = 10
      if (newStats.visitedFiles.size >= totalGameFiles) {
        // congratulations.txtをfileSystemに動的に追加
        if (
          !fileSystem["~"].contents!["dungeon"].contents!["congratulations.txt"]
        ) {
          fileSystem["~"].contents!["dungeon"].contents![
            "congratulations.txt"
          ] = {
            type: "file",
            permissions: "-r--r--r--",
            size: "1KB",
            body: [
              "🎉✨ ゲームクリア！ ✨🎉",
              "",
              "　　　おめでとう、真の探索者よ！",
              "",
              "あなたはデジタルダンジョンの全ての秘密を",
              "解き明かし、すべてのファイルを探索した！",
              "",
              "🏆 達成した偉業:",
              "─────────────────────",
              "• 全ファイル探索完了",
              "• 宝物庫の財宝発見",
              "• 古代ドラゴンの謎解き",
              "• 隠しファイルの発見",
              "• 魔法スクリプトの習得",
              "",
              "🎮 最終ステータス確認: status",
              "",
              "君はもう立派なLinuxマスターだ！",
              "この冒険で学んだコマンドやスキルを",
              "実際の開発でも活用してくれ！",
              "",
              "🌟 ファイナルメッセージ:",
              "「真の探索は、知識の果てにではなく、",
              " 未知への好奇心の中にある」",
              "",
              "デジタルダンジョンアドベンチャー",
              "制作者: Kentaro Morishita",
              "",
              "ご冒険ありがとうございました！ 🗡️✨🏰",
            ],
          }
        }

        setTimeout(() => {
          appendOutput(outputBox, [
            "",
            "🌟✨ 全ファイル探索完了！ ✨🌟",
            "",
            "突然、ダンジョンの奥から光が差し込んだ...",
            "新しいファイルが現れた: congratulations.txt",
            "💡 ダンジョンディレクトリで確認してみよう！",
          ])
        }, 1000)
      }
    }

    return newStats
  })

  // スペル実行のシミュレーション
  if (actualFilePath === "fire_spell.sh") {
    appendOutputWithClass(
      outputBox,
      [
        "🔥 FIRE SPELL ACTIVATED! 🔥",
        "",
        "        🔥",
        "      🔥🔥🔥",
        "    🔥🔥🔥🔥🔥",
        "      🔥🔥🔥",
        "        🔥",
        "",
        "WHOOSH! Fire spell cast!",
        "🎯 Hit! Enemy takes 25 damage!",
        "",
        "✨ 魔法の力を感じる...",
      ],
      "cat-output japanese-content"
    )

    // ゲームステータス更新
    gameStatsBox.setValue((prevStats) => {
      const newStats = { ...prevStats }
      newStats.achievements.spellCaster = true
      newStats.experience += 30

      if (!newStats.items.includes("火の魔法石")) {
        newStats.items.push("火の魔法石")
      }

      return newStats
    })

    appendOutputWithClass(
      outputBox,
      [
        "",
        "🎮 実績解除: 魔法使い",
        "🔥 火の魔法石を獲得！",
        "⭐ 30経験値獲得！",
      ],
      "cat-output japanese-content"
    )
  } else if (actualFilePath === "ice_spell.sh") {
    appendOutputWithClass(
      outputBox,
      [
        "❄️ ICE SPELL ACTIVATED! ❄️",
        "",
        "      ❄️    ❄️",
        "  ❄️    ❄️    ❄️",
        "    ❄️  ❄️  ❄️",
        "      ❄️❄️❄️",
        "        ❄️",
        "",
        "FREEZE! Ice spell activated!",
        "🧊 Enemy is frozen for 2 turns!",
        "",
        "❄️ 氷の力が周囲に広がる...",
      ],
      "cat-output japanese-content"
    )

    // ゲームステータス更新
    gameStatsBox.setValue((prevStats) => {
      const newStats = { ...prevStats }
      newStats.achievements.spellCaster = true
      newStats.experience += 30

      if (!newStats.items.includes("氷の魔法石")) {
        newStats.items.push("氷の魔法石")
      }

      return newStats
    })

    appendOutputWithClass(
      outputBox,
      [
        "",
        "🎮 実績解除: 魔法使い",
        "❄️ 氷の魔法石を獲得！",
        "⭐ 30経験値獲得！",
      ],
      "cat-output japanese-content"
    )
  } else {
    // 他の実行可能ファイル用の汎用実行
    appendOutputWithClass(
      outputBox,
      [
        "⚡ SCRIPT EXECUTED! ⚡",
        "",
        "魔法のスクリプトが実行されました！",
        "✨ 何かが起こった...",
      ],
      "cat-output japanese-content"
    )
  }
}

export const commands: Commands = {
  ls: listDirectory,
  cd: changeDirectory,
  cat: readFile,
  help: displayHelp,
  clear: clearOutput,
  whoami: displayWhoAmI,
  projects: displayProjects,
  la: listDirectoryLongAll,
  status: displayStatus,
  exec: executeScript,
}
