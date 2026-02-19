# La Liguita ⚽️

La Liguita is a modern web application designed to manage casual sports leagues. It allows users to track games, manage teams, record scores in real-time, and view player statistics and leaderboards.

Built with **Next.js**, **Firebase**, and **Tailwind CSS**.

## Features

*   **League Management**: Create and manage multiple leagues.
*   **Live Scoreboard**: Real-time scoring interface for active games.
*   **Player Stats**: Track points, assists, wins, and games played.
*   **Match History**: View past game results and details.
*   **Responsive Design**: Works great on desktop and mobile.

## Tech Stack

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: Zustand
*   **Backend / Database**: Firebase (Firestore, Auth)
*   **Icons**: Lucide React

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/la-liguita.git
    cd la-liguita
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your Firebase configuration keys. You can use `.env.example` as a template.
    ```bash
    cp .env.example .env.local
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
