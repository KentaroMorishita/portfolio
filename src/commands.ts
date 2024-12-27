import { RBox } from 'f-box-core';
import help from './assets/help.json' assert {type: "json"};
import type { FileNode } from './fileSystem';
import { fileSystem } from './fileSystem';

export type Commands = {
  ls: (ctx: CommandContext) => void;
  cd: (ctx: CommandContext, arg?: string) => void;
  cat: (ctx: CommandContext, arg?: string) => void;
  help: (ctx: CommandContext) => void;
  clear: (ctx: CommandContext) => void;
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

export const commands: Commands = {
  ls: listDirectory,
  cd: changeDirectory,
  cat: readFile,
  help: displayHelp,
  clear: clearOutput,
};
