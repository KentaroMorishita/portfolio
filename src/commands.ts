import { RBox } from 'f-box-core';
import help from './assets/help.json' assert {type: "json"};
import profile from './assets/profile.json' assert {type: "json"};
import projects from './assets/projects.json' assert {type: "json"};
import type { FileNode } from './fileSystem';
import { fileSystem } from './fileSystem';

export type Commands = {
  ls: (ctx: CommandContext) => void;
  cd: (ctx: CommandContext, arg?: string) => void;
  cat: (ctx: CommandContext, arg?: string) => void;
  help: (ctx: CommandContext) => void;
  clear: (ctx: CommandContext) => void;
  whoami: (ctx: CommandContext) => void;
  projects: (ctx: CommandContext) => void;
  neofetch: (ctx: CommandContext) => void;
}

export type AvailableCommands = keyof Commands

export type CommandContext = {
  currentPathBox: RBox<string[]>;
  outputBox: RBox<string[]>;
};

export const getCurrentDirectory = (currentPath: string[]): FileNode =>
  currentPath.slice(1).reduce<FileNode>((currentDir, dir) => currentDir.contents![dir], fileSystem["~"])

export const appendOutput = (outputBox: RBox<string[]>, message: string | string[]) => {
  outputBox.setValue((prev) => [...prev, ...[message].flat()]);
};

export const appendOutputWithTyping = (outputBox: RBox<string[]>, message: string | string[], delay: number = 30) => {
  const lines = [message].flat();
  let currentLineIndex = 0;
  let currentCharIndex = 0;
  
  const typeNextChar = () => {
    if (currentLineIndex >= lines.length) return;
    
    const currentLine = lines[currentLineIndex];
    const currentText = currentLine.slice(0, currentCharIndex + 1);
    
    outputBox.setValue((prev) => {
      const newOutput = [...prev];
      if (currentCharIndex === 0) {
        newOutput.push(currentText);
      } else {
        newOutput[newOutput.length - 1] = currentText;
      }
      return newOutput;
    });
    
    currentCharIndex++;
    
    if (currentCharIndex >= currentLine.length) {
      currentLineIndex++;
      currentCharIndex = 0;
      setTimeout(typeNextChar, delay * 2); // 行間は少し長めに
    } else {
      setTimeout(typeNextChar, delay);
    }
  };
  
  typeNextChar();
};

export const listDirectory = ({ currentPathBox, outputBox }: CommandContext) => {
  const dir = getCurrentDirectory(currentPathBox.getValue());
  const contents = dir.contents || {};
  const details = Object.entries(contents).map(([name, item]) => {
    const permissions = item.permissions
    const size = item.size;
    const separator = item.type === 'directory' ? '/' : ''
    return `${permissions} 1 morishita morishita ${size} ${name}${separator}`;
  });
  appendOutput(outputBox, details);
};

export const changeDirectory = ({ currentPathBox, outputBox }: CommandContext, arg?: string) => {
  if (!arg || arg === '~') {
    currentPathBox.setValue(() => ["~"]);
    return;
  }

  for (const dir of arg.split('/').filter(v => v !== '')) {
    if (dir === ".." && currentPathBox.getValue().length > 1) {
      currentPathBox.setValue((prev) => prev.slice(0, -1));
      continue;
    }

    const currentDir = getCurrentDirectory(currentPathBox.getValue());
    const target = currentDir?.contents?.[dir];

    if (!target || target.type !== "directory") {
      appendOutput(outputBox, `cd: The directory '${dir}' does not exist`);
      break;
    }
    currentPathBox.setValue((prev) => [...prev, dir]);
  }
};

export const readFile = ({ currentPathBox, outputBox }: CommandContext, arg?: string) => {
  if (!arg) {
    appendOutput(outputBox, 'cat: missing argument');
    return;
  }

  const dir = getCurrentDirectory(currentPathBox.getValue());
  const target = dir?.contents?.[arg];

  if (!target) {
    appendOutput(outputBox, `cat: ${arg}: No such file`);
    return;
  }

  if (target.type === "directory") {
    appendOutput(outputBox, `cat: ${arg}: Is a directory`);
    return;
  }
  appendOutput(outputBox, [`Displaying contents of ${arg}`, ...(target.body ?? [])]);
};

export const displayHelp = (ctx: CommandContext) => appendOutput(ctx.outputBox, (help as string[]));
export const clearOutput = (ctx: CommandContext) => ctx.outputBox.setValue(() => []);

export const displayWhoAmI = (ctx: CommandContext) => {
  const profileData = profile;
  const output = [
    "╭─────────────────────────────────────────────────────╮",
    "│                    👨‍💻 PROFILE INFO                    │",
    "├─────────────────────────────────────────────────────┤",
    `│ Name:     ${profileData.name.padEnd(39)} │`,
    `│ Age:      ${profileData.age.padEnd(39)} │`,
    `│ Job:      ${profileData.job.padEnd(39)} │`,
    "├─────────────────────────────────────────────────────┤",
    "│                    🔗 LINKS                         │",
    "├─────────────────────────────────────────────────────┤",
    `│ GitHub:   ${profileData.github.padEnd(39)} │`,
    `│ Qiita:    ${profileData.qiita.padEnd(39)} │`,
    `│ X:        ${profileData.sns.x.padEnd(39)} │`,
    "├─────────────────────────────────────────────────────┤",
    "│                    🚀 OWN WORKS                     │",
    "├─────────────────────────────────────────────────────┤",
    `│ f-box-core:  ${profileData.ownWorks['f-box-core'].padEnd(34)} │`,
    `│ f-box-react: ${profileData.ownWorks['f-box-react'].padEnd(34)} │`,
    `│ f-box-docs:  ${profileData.ownWorks['f-box-docs'].padEnd(34)} │`,
    "├─────────────────────────────────────────────────────┤",
    "│                    🎨 HOBBIES                       │",
    "├─────────────────────────────────────────────────────┤",
    `│ ${profileData.hobbies.join(' • ').padEnd(51)} │`,
    "╰─────────────────────────────────────────────────────╯"
  ];
  appendOutputWithTyping(ctx.outputBox, output, 20);
};

export const displayProjects = (ctx: CommandContext) => {
  const projectsData = projects;
  const output = [
    "╭─────────────────────────────────────────────────────────────────╮",
    "│                           🚀 PROJECTS                           │",
    "╰─────────────────────────────────────────────────────────────────╯",
    ""
  ];
  
  projectsData.forEach((project, index) => {
    output.push(
      `📁 ${project.name}`,
      `   ${project.description}`,
      `   Tech: ${project.tech.join(', ')}`,
      `   Status: ${project.status}`,
      ""
    );
    
    Object.entries(project.links).forEach(([key, url]) => {
      output.push(`   🔗 ${key}: ${url}`);
    });
    
    if (index < projectsData.length - 1) {
      output.push("", "─".repeat(65), "");
    }
  });
  
  appendOutput(ctx.outputBox, output);
};

export const displayNeofetch = (ctx: CommandContext) => {
  const profileData = profile;
  const skills = Object.keys(fileSystem["~"].contents!.skills.contents!);
  
  const output = [
    "                   -`                    kentaromorishita@portfolio",
    "                  .o+`                   ──────────────────────────────",
    "                 `ooo/                   OS: Developer Environment v2024",
    "                `+oooo:                  Host: Web Portfolio Terminal",
    "               `+oooooo:                 Kernel: React 19.1.0",
    "               -+oooooo+:                Uptime: Always learning",
    "             `/:-:++oooo+:               Packages: " + skills.length + " skills installed",
    "            `/++++/+++++++:              Shell: TypeScript CLI",
    "           `/++++++++++++++:             Resolution: Full-stack developer",
    "          `/+++ooooooooo+++/             DE: VS Code",
    "         ./ooosssso++osssssso+`          WM: F-Box State Manager",
    "        .oossssso-````/ossssss+`         Theme: Terminal Green [GTK3]",
    "       -osssssso.      :ssssssso.        Icons: Emoji Pack",
    "      :osssssss/        osssso+++.       Terminal: Modern CLI Portfolio",
    "     /ossssssss/        +ssssooo/-       CPU: " + profileData.name,
    "   `/ossssso+/:-        -:/+osssso+-     GPU: Creative Problem Solving",  
    "  `+sso+:-`                 `.-/+oso:    Memory: " + profileData.age + " years of experience",
    " `++:.                           `-/+/   Disk: ∞ GB of curiosity",
    " .`                                 `/   ",
    "",
    "                     Core Skills: " + skills.slice(0, 5).join(', '),
    "                     Hobbies: " + profileData.hobbies.join(', '),
    "                     Contact: " + profileData.github
  ];
  
  appendOutput(ctx.outputBox, output);
};

export const commands: Commands = {
  ls: listDirectory,
  cd: changeDirectory,
  cat: readFile,
  help: displayHelp,
  clear: clearOutput,
  whoami: displayWhoAmI,
  projects: displayProjects,
  neofetch: displayNeofetch,
};
