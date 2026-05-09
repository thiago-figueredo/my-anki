import { write } from "fs";
import readline from "readline"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})


const snake: string[] = ['@']
const BOARD_SIZE = 20
const initialX = Math.floor(Math.random() * BOARD_SIZE)
const initialY = Math.floor(Math.random() * BOARD_SIZE)

while (true) {
    console.log('\n'.repeat(BOARD_SIZE))
    // const pos = rl.getCursorPos();

    console.log({initialX, initialY})
    readline.cursorTo(process.stdout, initialX, initialY)
    process.stdout.write(snake.join(''))

    // console.log(`Row: ${pos.rows}, Column: ${pos.cols}`);
    break;
}

console.log()
rl.close();