import { RBox } from 'f-box-core';
import type { FileNode } from './fileSystem';
import { fileSystem } from './fileSystem';
import * as help from './assets/help.json';

export type CommandContext = {
  currentPathBox: RBox<string[]>;
  outputBox: RBox<string[]>;
};

export const getCurrentDirectory = (currentPath: string[]): FileNode | null => {
  let currentDir = fileSystem['~'];
  for (const dir of currentPath.slice(1)) {
    if (currentDir.type === 'directory' && currentDir.contents?.[dir]) {
      currentDir = currentDir.contents[dir];
    } else {
      return null;
    }
  }
  return currentDir;
};

const appendOutput = (
  outputBox: RBox<string[]>,
  message: string | string[]
) => {
  outputBox.setValue((prev) => [
    ...prev,
    ...(Array.isArray(message) ? message : [message]),
  ]);
};

export const listDirectory = (ctx: CommandContext) => {
  const dir = getCurrentDirectory(ctx.currentPathBox.getValue());
  if (!dir || dir.type !== 'directory') {
    appendOutput(ctx.outputBox, 'Not a directory');
    return;
  }
  const contents = dir.contents || {};
  const details = Object.entries(contents).map(([name, item]) => {
    const permissions =
      item.permissions ||
      (item.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--');
    const size = item.size || '1 KB';
    return `${permissions} 1 morishita morishita ${size} ${name}${
      item.type === 'directory' ? '/' : ''
    }`;
  });
  appendOutput(ctx.outputBox, details);
};

export const changeDirectory = (ctx: CommandContext, dir?: string) => {
  if (!dir) {
    appendOutput(ctx.outputBox, 'cd: missing argument');
    return;
  }

  if (dir === '..') {
    ctx.currentPathBox.setValue((prev) =>
      prev.length > 1 ? prev.slice(0, -1) : prev
    );
    appendOutput(
      ctx.outputBox,
      `Changed directory to ${ctx.currentPathBox.getValue().join('/') || '~'}`
    );
    return;
  }

  const dirObj = getCurrentDirectory(ctx.currentPathBox.getValue());
  if (
    !dirObj ||
    !dirObj.contents?.[dir] ||
    dirObj.contents[dir].type !== 'directory'
  ) {
    appendOutput(ctx.outputBox, `cd: ${dir}: No such directory`);
    return;
  }

  ctx.currentPathBox.setValue((prev) => [...prev, dir]);
  appendOutput(ctx.outputBox, `Changed directory to ${dir}`);
};

export const readFile = (ctx: CommandContext, file?: string) => {
  if (!file) {
    appendOutput(ctx.outputBox, 'cat: missing argument');
    return;
  }
  const dir = getCurrentDirectory(ctx.currentPathBox.getValue());
  if (!dir || dir.type !== 'directory' || !dir.contents?.[file]) {
    appendOutput(ctx.outputBox, `cat: ${file}: No such file`);
    return;
  }
  const target = dir.contents[file];
  if (target.type === 'directory') {
    appendOutput(ctx.outputBox, `cat: ${file}: Is a directory`);
    return;
  }
  appendOutput(ctx.outputBox, [
    `Displaying contents of ${file}`,
    ...(target.body || []),
  ]);
};

export const displayHelp = (ctx: CommandContext) => {
  appendOutput(ctx.outputBox, (help as any).default);
};

export const clearOutput = (ctx: CommandContext) => {
  ctx.outputBox.setValue(() => []);
};

// commands オブジェクト
export const commands: Record<
  string,
  (ctx: CommandContext, arg?: string) => void
> = {
  ls: listDirectory,
  cd: changeDirectory,
  cat: readFile,
  help: displayHelp,
  clear: clearOutput,
};
