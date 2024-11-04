export function hideCursor() {
    process.stdout.write('\x1B[?25l');
}

export function showCursor() {
    process.stdout.write('\x1B[?25h');
}

const foregroundColors = {
    Red: "\x1B[31m",
    Yellow: "\x1B[33m",
    Green: "\x1B[32m",
    White: "\x1B[37m"
}

export const progressBar = (current: number, total: number, label: string, lineIndex: number = 0, lineTotal: number = 1) => {
    const totalRows = process.stdout.rows;
    const row = totalRows - 1 - (lineTotal - lineIndex);
    const percentage = Math.round((current / total) * 100);
    let fgColor = foregroundColors.White;
    // choose color based on percentage
    if (percentage < 30) {
        fgColor = foregroundColors.Red;
    } else if (percentage < 70) {
        fgColor = foregroundColors.Yellow;
    } else {
        fgColor = foregroundColors.Green;
    }
    const bar = '='.repeat(Math.round(percentage / 2)) + ' '.repeat(50 - Math.round(percentage / 2));
    process.stdout.cursorTo(0, row);
    process.stdout.write(`\r\x1B[0m${label} [${fgColor}${bar}\x1B[0m] ${percentage}%`);
}

export const padNumber = (num: number, size: number) => {
    return num.toString().padStart(size, ' ');
}