# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + TypeScript application built with Vite. Uses React 19 with modern ESLint configuration and Hot Module Replacement (HMR) for fast development.

## Development Commands

```bash
npm run dev       # Start development server with HMR (default: http://localhost:5173)
npm run build     # Type-check with tsc and build for production
npm run lint      # Run ESLint on all TypeScript files
npm run preview   # Preview production build locally
```

## Architecture

### Entry Points
- `index.html` - Root HTML file that loads the app
- `src/main.tsx` - Application entry point, renders App in React StrictMode
- `src/App.tsx` - Root React component

### Build Configuration
- **Vite** (`vite.config.ts`) - Build tool with @vitejs/plugin-react for Fast Refresh
- **TypeScript** - Uses project references with separate configs:
  - `tsconfig.json` - Root config with references
  - `tsconfig.app.json` - App source code configuration
  - `tsconfig.node.json` - Vite config and Node.js files configuration

### Linting
- Uses flat config format (`eslint.config.js`)
- Configured for TypeScript with React-specific rules
- Includes react-hooks and react-refresh plugins
- Ignores `dist` directory

## Project Structure

```
src/
├── main.tsx          # App entry point
├── App.tsx           # Root component
├── App.css           # Component styles
├── index.css         # Global styles
└── assets/           # Static assets (SVGs, images)
```

## Key Technologies

- **React 19** with TypeScript
- **Vite 7** for build tooling and dev server
- **ESLint 9** with TypeScript support
- ES modules (`"type": "module"` in package.json)

## Git 제외 규칙

아래 항목은 프로젝트 구동과 무관한 로컬 전용 파일이므로 `.gitignore`에 등록하여 git에 올리지 않습니다.

| 경로 | 이유 |
|------|------|
| `.claude/` | Claude Code 로컬 설정·훅 (개인 개발 환경 전용) |
| `.env`, `.env.*` | API 키 등 민감 정보 |
| `node_modules/` | 의존성 패키지 (설치로 복원 가능) |
| `dist/`, `dist-ssr/` | 빌드 산출물 (빌드 명령으로 재생성 가능) |

> 새로운 툴·에디터 전용 디렉터리가 생기면 동일하게 `.gitignore`에 추가하고 이 목록을 업데이트합니다.

## Commit Message Convention

모든 커밋 메시지는 아래 형식을 따릅니다.

```
<type>: <subject>

[optional body]
```

### Type 목록

| Type | 사용 시점 |
|------|-----------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 (CLAUDE.md, README 등) |
| `style` | UI/CSS 변경, 코드 포맷 (기능 변경 없음) |
| `refactor` | 기능 변경 없이 코드 구조 개선 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 빌드 설정, 의존성, 툴링 변경 |

### 예시

```
[feat] 감정 분석 결과 캐싱 추가
[fix] 버튼 텍스트가 반영되지 않던 index.html 진입점 수정
[docs] 커밋 메시지 컨벤션 추가
[style] 제출 버튼 텍스트 '공감해줘!'로 변경
[refactor] 감정 앵커 문장 상수 분리
[chore] check-secrets.py 푸시 전 API 키 검사 훅 추가
```
