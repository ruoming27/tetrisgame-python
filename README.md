# 🎮 Tetris Game Collection

[![Python Version](https://img.shields.io/badge/python-3.6%2B-blue)](https://www.python.org/)
[![Pygame](https://img.shields.io/badge/pygame-2.0%2B-green)](https://www.pygame.org/)
[![JavaScript](https://img.shields.io/badge/javascript-ES6%2B-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

<div align="center">
  <img src="screenshot.png" alt="Tetris Game Screenshot" width="600">
</div>

## Demo

Play the game live here:  
[https://ruoming27.github.io/tetrisgame-python/](https://ruoming27.github.io/tetrisgame-python/)

---


## 🚀 Features

| Feature              | Python | Web |
|----------------------|--------|-----|
| Classic Gameplay     | ✅     | ✅  |
| Ghost Piece          | ✅     | ✅  |
| 7-Bag Randomizer     | ✅     | ✅  |
| Score System         | ✅     | ✅  |
| Next Piece Preview   | ✅     | ✅  |
| Pause/Restart        | ✅     | ✅  |

## 📁 Project Structure
tetris/\
├── tetris.py # Python implementation (Pygame)\
├── web/ # Web version\
│ ├── index.html # HTML structure\
│ └── tetris.js # Game logic\
├── assets/ # (Optional) Game assets\
└── README.md # This file


## 🖥️ Python Version

### Requirements
```bash
pip install pygame

Run
python tetris.py

Controls
Key	Action
← →	Move left/right
↓	Soft drop
↑ or X	Rotate clockwise
Z	Rotate counter-clockwise
Space	Hard drop
P	Pause/resume
R	Restart
Q or ESC	Quit

🌐 Web Version
Run
Simply open web/index.html in any modern browser

Additional Features
Responsive design

Mobile-friendly controls

🎯 How to Play
Stack blocks to complete lines

Each line clear increases your score

Game speeds up as you level up

Try to survive as long as possible!

📊 Scoring
Lines Cleared	Points (× level)
1	100
2	300
3	500
4 (Tetris)	800

🛠️ Development
# For Python version testing
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt

🤝 Contributing
Pull requests welcome! For major changes, please open an issue first.

📜 License
MIT