import * as help from './assets/help.json';
import * as profile from './assets/profile.json';

export type FileType = 'file' | 'directory';

export interface FileNode {
  type: FileType;
  contents?: Record<string, FileNode>;
  body?: string[];
  permissions?: string;
  size?: string;
}

export const fileSystem: Record<string, FileNode> = {
  '~': {
    type: 'directory',
    contents: {
      'profile.json': {
        type: 'file',
        permissions: '-rw-r--r--',
        size: '552B',
        body: [JSON.stringify((profile as any).default, null, 2)],
      },
      skills: {
        type: 'directory',
        contents: {
          TypeScript: {
            type: 'file',
            permissions: '-rw-r--r--',
            size: '20 GB',
          },
          JavaScript: { type: 'file', permissions: '-rw-r--r--', size: '5 GB' },
          React: { type: 'file', permissions: '-rw-r--r--', size: '10 GB' },
          'Next.js': { type: 'file', permissions: '-rw-r--r--', size: '4 GB' },
          'Vue.js': { type: 'file', permissions: '-rw-r--r--', size: '2 GB' },
          'Nuxt.js': { type: 'file', permissions: '-rw-r--r--', size: '4 GB' },
          'Tailwind CSS': {
            type: 'file',
            permissions: '-rw-r--r--',
            size: '1 GB',
          },
          AWS: { type: 'file', permissions: '-rw-r--r--', size: '5 GB' },
          PHP: { type: 'file', permissions: '-rw-r--r--', size: '6 GB' },
          Laravel: { type: 'file', permissions: '-rw-r--r--', size: '4 GB' },
          MySQL: { type: 'file', permissions: '-rw-r--r--', size: '4 GB' },
          Docker: { type: 'file', permissions: '-rw-r--r--', size: '2 GB' },
        },
        permissions: 'drwxr-xr-x',
        size: '-',
      },
      'README.md': {
        type: 'file',
        permissions: '-rw-r--r--',
        size: '196B',
        body: [...(help as any).default],
      },
    },
    permissions: 'drwxr-xr-x',
    size: '-',
  },
};
