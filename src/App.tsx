import React, { useEffect, useState } from 'react';
import { RBox, Maybe } from 'f-box-core';
import { useRBox } from 'f-box-react';
import type { CommandContext, AvailableCommands } from './commands';
import { commands, appendOutput } from './commands';

const backgoundImageURL = 'https://picsum.photos/1920/1080?blur=2';

const ctx: CommandContext = {
  currentPathBox: RBox.pack<string[]>(['~']),
  outputBox: RBox.pack<string[]>(['Welcome to the CLI portfolio!']),
};

const App: React.FC = () => {
  const [currentPath] = useRBox(ctx.currentPathBox);
  const [output] = useRBox(ctx.outputBox);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCommand = (_input: string) => {
    const input = _input.trim();
    if (!input) return;

    const [cmd, arg] = input.split(' ') as [cmd: AvailableCommands, arg: string];
    Maybe.pack(commands[cmd]).match(
      (cmd) => cmd(ctx, arg),
      () => appendOutput(ctx.outputBox, `Unknown command: ${cmd}. Type 'help' for available commands.`)
    );
  };

  useEffect(() => {
    const handleClick = () => document.getElementById("console")?.focus();
    window.addEventListener("click", handleClick);
    
    // 背景画像を事前に読み込み
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = backgoundImageURL;
    
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      className="py-5 min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ 
        background: imageLoaded 
          ? `url('${backgoundImageURL}') center/cover` 
          : 'linear-gradient(to bottom right, #111827, #374151, #000000)',
      }}
    >
      <div className="bg-gray-800 w-[90%] max-w-[1000px] h-[70%] max-h-[700px] min-h-[618px] rounded-lg shadow-lg flex flex-col opacity-85 text-sm">
        <div className="bg-gray-900 h-8 min-h-8 flex items-center px-4 rounded-t-lg">
          <div className="flex space-x-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          </div>
        </div>
        <div className="bg-black text-green-400 font-mono p-4 overflow-y-auto whitespace-pre-wrap">
          {output.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
        <div className="flex-1 bg-black text-green-400 font-mono p-4">
          <span>{currentPath.join('/')} $ </span>
          <input
            autoFocus
            type="text"
            id="console"
            className="bg-black text-green-400 border-none outline-none w-3/4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommand((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
