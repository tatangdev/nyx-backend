# Telegram Crypto Game: Virtual Exchange Adventure
This is a Telegram-based crypto game where players manage a virtual crypto exchange, unlocking various game features to mine coins and build their in-game wealth. Engage in tasks, upgrade abilities, and strategically manage resources to optimize earnings. This project also includes a comprehensive admin dashboard for efficient player and game management.

## Features
### Player Features
Players can engage in the game directly via Telegram with a variety of interactive and rewarding features:

- **Unlock and Upgrade Cards**: Collect and enhance cards that boost game performance.
- **Profit per Hour**: Earn passive income while online, continuing for up to 2 hours after going offline.
- **Daily Tasks and Challenges**: Complete tasks like daily logins, following social media channels, and submitting card combos for additional rewards.
- **Energy and Tapping Mechanics**:
    - **Energy Tap-to-Get Upgrade**: Increase maximum energy tap capacity.
    - **Tap-to-Get Value**: Boost the value of each tap to maximize profit.
    - **Energy Recovery Rate**: Upgrade the rate at which energy is recovered per second, enhancing gameplay pace.

### Admin Dashboard
An intuitive and powerful dashboard allows admins to efficiently manage the game and its players:

- **Card Management**: Create, update, and launch cards available for players.
- **Player Level Management**: Control and adjust player levels for a tailored experience.
- **Daily Card Combo Management**: Set up and manage card combinations that players can aim to achieve.
- **Player Monitoring**: Track players, including their referral networks (referrer and referee tree).
- **Player Progress Tracking**: View detailed analytics of player levels and earnings.
- **Balance Adjustments**: Update player balances to ensure accurate in-game currency handling.
- **Task Management**: Define and manage tasks for players to complete.
- **Broadcasting Messages**: Send announcements or important messages directly to players on Telegram.

## API Documentation
- [Player API Documentation](https://nyx-backend.up.railway.app/docs/?urls.primaryName=Player+V1) – Detailed documentation for the player-side API.
- [Admin API Documentation](https://nyx-backend.up.railway.app/docs/?urls.primaryName=Admin+V1) – Documentation covering the admin-side API, including features and controls.

## Demo
Try the game live on Telegram: [Telegram Bot Demo Game](https://t.me/t2e_game_bot)

## Technologies Used
- [Express.js](https://expressjs.com/) – Node.js framework for building server-side applications.
- [Prisma](https://www.prisma.io/) – Object-Relational Mapper for managing data interactions with PostgreSQL.
- [PostgreSQL](https://www.postgresql.org/) – Relational database for secure, reliable data storage.
- [Telegraf](https://github.com/telegraf/telegraf) – Telegram bot framework for building and managing the game’s bot functionality.
- [ImageKit](https://imagekit.io/) – Media management for storing and delivering images efficiently.

> This repository serves as the codebase for the Telegram-based crypto game and provides everything needed for a seamless player and admin experience.
