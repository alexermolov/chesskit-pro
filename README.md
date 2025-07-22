<div align="center">
  <a href="https://github.com/alexermolov/chesskit-pro">
    <img width="120" height="120" src="https://github.com/alexermolov/chesskit-pro/blob/main/public/android-chrome-192x192.png" alt="Logo">
  </a>

<h3 align="center">Chesskit</h3>
  <p align="center">
    The Ultimate Chess Web and Desktop App
  </p>
</div>
<br />

Chesskit is an open-source chess website to play, view, analyze and review your chess games for free on any device with Stockfish !

## Mission

Chesskit aims to offer all the chess related features it can, while being free and open-source. It is designed to be easy to use, fast, and reliable.

## Features

- Load and review games from [chess.com](https://chess.com) and [lichess.org](https://lichess.org)
- Analysis board with live engine evaluation, custom arrows, evaluation graph, ...
- Moves classification (Brilliant, Great, Good, Mistake, Blunder, ...)
- Chess960 and Puzzles support
- Play against Stockfish at any elo
- Store your games in your browser database

<img src="https://github.com/GuillaumeSD/Chesskit/blob/main/assets/showcase.png" />

## Stack

Built with [Next.js](https://nextjs.org/docs), [React](https://react.dev/learn/describing-the-ui), [Material UI](https://mui.com/material-ui/getting-started/overview/), and [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html).

Deployed on AWS with [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html), see it live [here](https://chesskit.org).

## Running the app in dev mode

> [!IMPORTANT]  
> At least [Node.js](https://nodejs.org) 22.11 is required.

Install the dependencies :

```bash
npm i
```

Run the development server :

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser to see the app running.

The app will automatically refresh on any source file change.

## Lint

Run it with :

```bash
npm run lint
```

## Contribute

See [contributing](CONTRIBUTING.md) for details on how to contribute to the project.


## License

GNU AFFERO GENERAL PUBLIC LICENSE
