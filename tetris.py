#!/usr/bin/env python3
# Tetris in Python with Pygame
# Controls:
#   Left/Right  - move
#   Down        - soft drop
#   Up / X      - rotate clockwise
#   Z           - rotate counter-clockwise
#   Space       - hard drop
#   P           - pause/resume
#   R           - restart
#   Q / ESC     - quit
#
# Run:
#   pip install pygame
#   python tetris.py

import sys
import random
import pygame

# ---- Config ----
COLS, ROWS = 10, 20
CELL = 30
BORDER = 2
PLAY_W, PLAY_H = COLS * CELL, ROWS * CELL
SIDE_W = 200
WINDOW_W, WINDOW_H = PLAY_W + SIDE_W, PLAY_H
FPS = 60

# Colors
BLACK = (10, 10, 10)
GRAY = (30, 30, 30)
WHITE = (240, 240, 240)
GHOST = (180, 180, 180)

COLORS = {
    0: (0, 0, 0),
    1: (255, 51, 119),   # T
    2: (255, 165, 0),    # L
    3: (0, 153, 255),    # J
    4: (255, 215, 0),    # O
    5: (0, 204, 102),    # S
    6: (204, 0, 0),      # Z
    7: (153, 51, 255),   # I
}

# Shapes as matrices (non-zero IDs match COLORS)
TETROMINOES = {
    'T': [[0,1,0],
          [1,1,1],
          [0,0,0]],
    'L': [[0,0,2],
          [2,2,2],
          [0,0,0]],
    'J': [[3,0,0],
          [3,3,3],
          [0,0,0]],
    'O': [[4,4],
          [4,4]],
    'S': [[0,5,5],
          [5,5,0],
          [0,0,0]],
    'Z': [[6,6,0],
          [0,6,6],
          [0,0,0]],
    'I': [[0,0,0,0],
          [7,7,7,7],
          [0,0,0,0],
          [0,0,0,0]]
}

# Wall kick: simple offset trial (not SRS, but works well)
KICK_TESTS = [0, 1, -1, 2, -2]

# ---- Helpers ----
def rotate(matrix, cw=True):
    # Clockwise: transpose + reverse rows
    if cw:
        return [list(row)[::-1] for row in zip(*matrix)]
    # CCW: reverse rows then transpose
    return list(map(list, zip(*matrix)))[::-1]

def create_grid():
    return [[0 for _ in range(COLS)] for _ in range(ROWS)]

def valid_position(grid, piece, offx, offy):
    for y, row in enumerate(piece):
        for x, val in enumerate(row):
            if val:
                nx, ny = offx + x, offy + y
                if nx < 0 or nx >= COLS or ny >= ROWS:
                    return False
                if ny >= 0 and grid[ny][nx]:
                    return False
    return True

def lock_piece(grid, piece, offx, offy):
    for y, row in enumerate(piece):
        for x, val in enumerate(row):
            if val:
                ny = offy + y
                nx = offx + x
                if 0 <= ny < ROWS and 0 <= nx < COLS:
                    grid[ny][nx] = val

def clear_lines(grid):
    new_grid = [row for row in grid if any(v == 0 for v in row)]
    cleared = ROWS - len(new_grid)
    while len(new_grid) < ROWS:
        new_grid.insert(0, [0]*COLS)
    return new_grid, cleared

def ghost_drop_y(grid, piece, x, y):
    # Drop until collision
    while valid_position(grid, piece, x, y+1):
        y += 1
    return y

def draw_cell(surf, x, y, color, ghost=False):
    px = x * CELL
    py = y * CELL
    rect = pygame.Rect(px, py, CELL, CELL)
    if ghost:
        pygame.draw.rect(surf, GHOST, rect, width=1)
    else:
        pygame.draw.rect(surf, color, rect, border_radius=4)
        pygame.draw.rect(surf, GRAY, rect, width=1)

def draw_grid_lines(surf):
    for x in range(COLS+1):
        pygame.draw.line(surf, GRAY, (x*CELL, 0), (x*CELL, PLAY_H))
    for y in range(ROWS+1):
        pygame.draw.line(surf, GRAY, (0, y*CELL), (PLAY_W, y*CELL))

# ---- Piece Bag (7-bag randomizer) ----
class Bag:
    def __init__(self):
        self.bag = []
    def next(self):
        if not self.bag:
            self.bag = list(TETROMINOES.keys())
            random.shuffle(self.bag)
        return self.bag.pop()

# ---- Game ----
class Game:
    def __init__(self):
        self.grid = create_grid()
        self.bag = Bag()
        self.score = 0
        self.level = 1
        self.lines = 0
        self.paused = False
        self.game_over = False

        self.current_type = self.bag.next()
        self.current = [row[:] for row in TETROMINOES[self.current_type]]
        self.x = COLS // 2 - len(self.current[0]) // 2
        self.y = -2

        self.next_type = self.bag.next()

        self.drop_timer = 0
        self.drop_interval = 1000  # ms base, reduced by level

    def reset(self):
        self.__init__()

    def spawn_new_piece(self):
        self.current_type = self.next_type
        self.current = [row[:] for row in TETROMINOES[self.current_type]]
        self.x = COLS // 2 - len(self.current[0]) // 2
        self.y = -2
        self.next_type = self.bag.next()

        if not valid_position(self.grid, self.current, self.x, self.y+1):
            self.game_over = True

    def soft_drop(self):
        if valid_position(self.grid, self.current, self.x, self.y+1):
            self.y += 1
            self.score += 1
        else:
            self.lock_and_clear()

    def hard_drop(self):
        self.y = ghost_drop_y(self.grid, self.current, self.x, self.y)
        self.lock_and_clear()

    def move(self, dx):
        if valid_position(self.grid, self.current, self.x+dx, self.y):
            self.x += dx

    def rotate_cw(self):
        self._try_rotate(cw=True)

    def rotate_ccw(self):
        self._try_rotate(cw=False)

    def _try_rotate(self, cw=True):
        rotated = rotate(self.current, cw=cw)
        for k in KICK_TESTS:
            if valid_position(self.grid, rotated, self.x + k, self.y):
                self.current = rotated
                self.x += k
                return

    def lock_and_clear(self):
        lock_piece(self.grid, self.current, self.x, self.y)
        self.grid, cleared = clear_lines(self.grid)
        if cleared:
            self.lines += cleared
            self.score += [0, 100, 300, 500, 800][min(cleared, 4)] * self.level
            self.level = 1 + self.lines // 10
        self.spawn_new_piece()

    def update(self, dt_ms):
        if self.paused or self.game_over:
            return
        self.drop_timer += dt_ms
        interval = max(100, self.drop_interval - (self.level-1)*80)
        if self.drop_timer >= interval:
            self.drop_timer = 0
            if valid_position(self.grid, self.current, self.x, self.y+1):
                self.y += 1
            else:
                self.lock_and_clear()

    def draw(self, screen, font):
        # Playfield
        play_surface = pygame.Surface((PLAY_W, PLAY_H))
        play_surface.fill(BLACK)

        # Ghost piece
        gy = ghost_drop_y(self.grid, self.current, self.x, self.y)
        for y, row in enumerate(self.current):
            for x, val in enumerate(row):
                if val:
                    draw_cell(play_surface, self.x + x, gy + y, GHOST, ghost=True)

        # Locked grid
        for y, row in enumerate(self.grid):
            for x, val in enumerate(row):
                if val:
                    draw_cell(play_surface, x, y, COLORS[val])

        # Current piece
        for y, row in enumerate(self.current):
            for x, val in enumerate(row):
                if val:
                    draw_cell(play_surface, self.x + x, self.y + y, COLORS[val])

        # Grid lines (optional)
        draw_grid_lines(play_surface)

        screen.blit(play_surface, (0, 0))

        # Sidebar
        sidebar = pygame.Surface((SIDE_W, PLAY_H))
        sidebar.fill((20, 20, 28))

        # Next
        label = font.render("NEXT", True, WHITE)
        sidebar.blit(label, (20, 20))

        next_matrix = TETROMINOES[self.next_type]
        # center next piece preview
        nx = 20
        ny = 60
        for y, row in enumerate(next_matrix):
            for x, val in enumerate(row):
                if val:
                    rect = pygame.Rect(nx + x*CELL, ny + y*CELL, CELL, CELL)
                    pygame.draw.rect(sidebar, COLORS[val], rect, border_radius=4)
                    pygame.draw.rect(sidebar, GRAY, rect, width=1)

        # Stats
        stats = [
            f"Score: {self.score}",
            f"Lines: {self.lines}",
            f"Level: {self.level}",
            "",
            "Controls:",
            "←/→ move",
            "↓ soft drop",
            "↑/X rotate CW",
            "Z rotate CCW",
            "Space hard drop",
            "P pause, R restart",
            "Q/ESC quit"
        ]
        yoff = 220
        for s in stats:
            txt = font.render(s, True, WHITE)
            sidebar.blit(txt, (20, yoff))
            yoff += 24

        if self.paused:
            ptxt = font.render("PAUSED", True, WHITE)
            sidebar.blit(ptxt, (20, WINDOW_H - 80))

        if self.game_over:
            gtxt = font.render("GAME OVER", True, WHITE)
            sidebar.blit(gtxt, (20, WINDOW_H - 80))

        screen.blit(sidebar, (PLAY_W, 0))

def main():
    pygame.init()
    pygame.display.set_caption("Tetris (Pygame)")
    screen = pygame.display.set_mode((WINDOW_W, WINDOW_H))
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("consolas", 18)

    game = Game()
    running = True
    while running:
        dt = clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_ESCAPE, pygame.K_q):
                    running = False
                elif event.key == pygame.K_p:
                    game.paused = not game.paused
                elif event.key == pygame.K_r:
                    game.reset()
                elif not game.paused and not game.game_over:
                    if event.key == pygame.K_LEFT:
                        game.move(-1)
                    elif event.key == pygame.K_RIGHT:
                        game.move(1)
                    elif event.key == pygame.K_DOWN:
                        game.soft_drop()
                    elif event.key in (pygame.K_UP, pygame.K_x):
                        game.rotate_cw()
                    elif event.key == pygame.K_z:
                        game.rotate_ccw()
                    elif event.key == pygame.K_SPACE:
                        game.hard_drop()

        game.update(dt)
        screen.fill((0, 0, 0))
        game.draw(screen, font)
        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
