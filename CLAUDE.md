# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

ターミナルインターフェースをシミュレートするCLIスタイルのポートフォリオサイトです。ユーザーはUnixライクなコマンドを使用して仮想ファイルシステムを操作し、開発者のプロフィール、スキル、プロジェクトを探索できます。

## 技術スタック & アーキテクチャ

- **React 18 + TypeScript + Vite**: モダンなReact開発環境
- **F-Boxステート管理**: RBoxコンテナを使ったリアクティブステート管理のためのカスタム`f-box-core`と`f-box-react`ライブラリを使用
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **仮想ファイルシステム**: ディレクトリ、ファイル、Unixスタイルの権限を持つ完全なファイルシステムシミュレーション

## コアアーキテクチャコンポーネント

### ステート管理 (F-Box)
- f-box-coreのRBoxコンテナをリアクティブステートに使用
- `src/hooks/useRBox.ts`のカスタム`useRBox`フックがReact統合を提供
- 2つの主要なステートコンテナ:
  - `currentPathBox`: 現在のディレクトリパスを追跡
  - `outputBox`: ターミナル出力履歴を管理

### コマンドシステム (`src/commands.ts`)
- Unixライクなコマンドを実装: `ls`, `cd`, `cat`, `help`, `clear`
- すべてのコマンドはRBoxステートコンテナを含む`CommandContext`上で動作
- コマンドの解析と実行は`App.tsx`で処理

### 仮想ファイルシステム (`src/fileSystem.ts`)
- `FileNode`インターフェースを持つ階層ファイルシステム
- Unixスタイルの権限とサイズを持つディレクトリとファイルをサポート
- ポートフォリオコンテンツがファイルとディレクトリとして埋め込まれている
- JSONアセット（`profile.json`, `help.json`）がインポートされてファイル内容として表示

### UIコンポーネント
- macOSライクなウィンドウ装飾を持つターミナルスタイルインターフェース
- 半透明ターミナルオーバーレイ付きの背景画像
- オートフォーカス入力処理とキーボードナビゲーション

## 開発コマンド

```bash
# 開発サーバーを開始
npm run dev

# プロダクション用ビルド（TypeScriptコンパイルを含む）
npm run build

# ESLintを実行
npm run lint

# プロダクションビルドをプレビュー
npm run preview
```

## 主要ファイルとその目的

- `src/App.tsx`: メインターミナルインターフェースコンポーネントとコマンド処理
- `src/commands.ts`: コマンド定義とファイルシステム操作
- `src/fileSystem.ts`: 仮想ファイルシステム構造とポートフォリオデータ
- `src/hooks/useRBox.ts`: f-boxステート管理用のReactフック
- `src/assets/`: 仮想ファイルシステムに表示されるポートフォリオデータを含むJSONファイル

## 仮想ファイルシステムでの作業

ポートフォリオコンテンツを修正する場合:
- 個人情報については`src/assets/profile.json`を更新
- 技術スキルについては`src/fileSystem.ts`の`skills`オブジェクトを修正
- 新しいコンテンツのために`fileSystem`エクスポートに新しいファイル/ディレクトリを追加

## コマンドシステムの拡張

新しいコマンドを追加するには:
1. `src/commands.ts`の`Commands`タイプにコマンド名を追加
2. `(ctx: CommandContext, arg?: string) => void`シグネチャに従ってコマンド関数を実装
3. `commands`オブジェクトエクスポートに追加
4. 新しいコマンドドキュメントで`src/assets/help.json`を更新