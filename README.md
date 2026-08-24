# JetArt

Interactive web application built with React, TypeScript, PixiJS, and Vite.

The project combines a React-based interface with a PixiJS-powered game engine. Games are available through dynamic routes using the `/game/:id` pattern.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router DOM
- PixiJS
- Styled Components
- ESLint

## Project Structure

```text
src/
├── Home.tsx
├── app
│   └── route.tsx
├── assets
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── components
│   ├── GameContainer.tsx
│   ├── ListItem.tsx
│   └── ScrollableList.tsx
├── config
│   ├── Config.ts
│   └── Games.ts
├── game
│   ├── GameConfig.ts
│   ├── SpaceShooterGame.ts
│   ├── core
│   ├── entities
│   ├── levels
│   └── ui
├── main.tsx
├── pages
│   └── GamePage.tsx
├── physics
│   ├── InertiaScroller.ts
│   └── VelocityTracker.ts
├── styles
│   └── GlobalStyle.ts
└── utils
    ├── device.ts
    └── getGameById.ts
```

## Routing

The application uses dynamic routing for games.

```text
/          → Games list
/game/:id  → Selected game
```

Example:

```text
/game/space-shooter
```

The game ID is retrieved from the URL and used to find the corresponding game configuration.

## Game Configuration

Available games are defined in the configuration.

```ts
export const games = [
    {
        id: 'space-shooter',
        name: 'Space Shooter'
    }
];
```

When a user opens a game route, the application retrieves the game configuration by its ID.

## Architecture

The project separates the React application layer from the PixiJS game logic.

```text
React Router
     ↓
GamePage
     ↓
Game Configuration
     ↓
GameContainer
     ↓
SpaceShooterGame
     ↓
PixiJS
```

### React Layer

React is responsible for:

- Routing
- Page rendering
- UI components
- Mounting and unmounting games

### Game Layer

The PixiJS game engine is responsible for:

- Game loop
- Player movement
- Shooting
- Bullets
- Collision detection
- Levels
- HUD
- Game state
- Game restart logic

## OOP Structure

The game logic is built using object-oriented programming principles.

Main classes include:

- `SpaceShooterGame` — main game controller
- `Player` — player entity
- `Bullet` — projectile entity
- `InputController` — keyboard input handling
- `AsteroidLevel` — first game level
- `BossLevel` — boss level logic
- `HUD` — game interface
- `MessageOverlay` — win/lose overlay
- `StarField` — animated background

The main game class coordinates all game systems and manages the application lifecycle.

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd jetart
```

Install dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

## Production Build

Create a production build:

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Linting

Run ESLint:

```bash
npm run lint
```

## Requirements

- Node.js 20+
- npm

## License

Public project.
