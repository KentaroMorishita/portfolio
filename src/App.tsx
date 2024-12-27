import React from 'react';
import { RBox, Maybe } from 'f-box-core';
import { useRBox } from 'f-box-react';
import type { CommandContext } from './commands';
import { commands } from './commands';

const backgoundImageURL =
  'https://images.unsplash.com/photo-1601266289415-e7339a97d19b?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const ctx: CommandContext = {
  currentPathBox: RBox.pack<string[]>(['~']),
  outputBox: RBox.pack<string[]>(['Welcome to the CLI portfolio!']),
};

const App: React.FC = () => {
  const [currentPath] = useRBox(ctx.currentPathBox);
  const [output] = useRBox(ctx.outputBox);

  const handleCommand = (_input: string) => {
    const input = _input.trim();
    if (!input) return;

    const [cmd, arg] = input.split(' ');
    Maybe.pack(commands[cmd]).match(
      (cmd) => cmd(ctx, arg),
      () => commands.help(ctx)
    );
  };

  return (
    <div
      className="py-5 min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url('${backgoundImageURL}')` }}
    >
      <div className="bg-gray-800 w-[90%] max-w-[1000px] h-[70%] max-h-[700px] min-h-[450px] rounded-lg shadow-lg flex flex-col opacity-85 text-sm">
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
