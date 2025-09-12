
<img width="1907" height="859" alt="image" src="https://github.com/user-attachments/assets/d3c33f66-e878-45ad-9f7d-0c0a0a672982" />

💜 About the project
---
Memetics is a turn-based online card game for two players. The fun part is that each match uses a random deck full of meme cards — every card has its own stats, and some come with special effects.

The main goal is to drop your opponent’s health to zero. To do that you’ll need to think a few steps ahead, keep track of your mana, and use your cards in the smartest way possible.


⚙️ Tech stack
---

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express, MySQL

Real-time: Socket.io

Auth: JWT

😸 Team
---

- Butterfly2112 (me) – frontend
- [1terraflops](https://github.com/1terraflops) – backend
- [DianaMalashta](https://github.com/DianaMalashta) – assets and design

Installation
--
Requirements

- Node.js

- MySQL

(For macOS users, you can install via Homebrew: brew install node mysql)

Clone the repo and go into the folder:

`https://github.com/Butterfly2112/Race01.git`

`cd Race01`

Install dependencies:

`npm install`


Adjust the database settings in config.json to match your MySQL setup.

(Optional) To enable password recovery via email, add Mailjet keys to .env or change the sendEmail function in utils.js to use another provider.

✅ Run the app

Start the server:

`node app.js`


or (dev mode):

`npm run dev`


Then open:

`http://localhost:3000/`


To test multiplayer, open the game in two different browsers or in an incognito tab.
