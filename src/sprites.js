// Pixel sprites shared by the mini-game and the background bugs.
// Each string is one row; "#" is a filled pixel.

// 11x8 "invader" bug, two animation frames
export const INVADER = [
  ['  #     #  ', '   #   #   ', '  #######  ', ' ## ### ## ', '###########', '# ####### #', '# #     # #', '   ## ##   '],
  ['  #     #  ', '#  #   #  #', '# ####### #', '### ### ###', '###########', ' ######### ', '  #     #  ', ' #       # '],
]

// 11x8 beetle, two animation frames (legs move)
export const BEETLE = [
  ['   #   #   ', '    ###    ', ' # ##### # ', '  #######  ', ' ######### ', '#  #####  #', '  #######  ', ' #  ###  # '],
  ['   #   #   ', '    ###    ', '#  #####  #', '  #######  ', ' ######### ', ' # ##### # ', '  #######  ', '#   ###   #'],
]

// 8x8 classic "squid" invader
export const SQUID = [
  ['   ##   ', '  ####  ', ' ###### ', '## ## ##', '########', '  #  #  ', ' # ## # ', '# #  # #'],
  ['   ##   ', '  ####  ', ' ###### ', '## ## ##', '########', ' # ## # ', '#      #', ' #    # '],
]

// 12x8 classic "octopus" invader
export const OCTOPUS = [
  ['    ####    ', ' ########## ', '############', '###  ##  ###', '############', '   ##  ##   ', '  ## ## ##  ', '##        ##'],
  ['    ####    ', ' ########## ', '############', '###  ##  ###', '############', '  ###  ###  ', ' ##  ##  ## ', '  ##    ##  '],
]

// 11x6 player ship
export const SHIP = ['     #     ', '    ###    ', '    ###    ', ' ######### ', '###########', '###########']

// Draws a sprite with its top-left corner at (x, y); `scale` = size of one pixel
export function drawSprite(ctx, rows, x, y, color, scale = 1) {
  ctx.fillStyle = color
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] === '#') ctx.fillRect(x + c * scale, y + r * scale, scale, scale)
    }
  }
}
