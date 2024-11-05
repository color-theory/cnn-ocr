import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { vectorSize } from '../app/config';
import * as fs from 'fs';
import * as path from 'path';

export const printFamily = (font: string, fontStyle: string, vectorSize: number, characters: string[]) => {
	const canvasSize = vectorSize;
	const canvas = createCanvas(canvasSize, canvasSize);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	ctx.font = `${fontStyle} ${canvasSize * .65}px ${font}`;
	characters.forEach((character: string) => {
		ctx.textBaseline = "top";
		ctx.fillText(character, 0, 0);
	});
	return { canvas, ctx };
}

export const printCharacter = (canvas: Canvas, ctx: CanvasRenderingContext2D, character: string, font: string, fontStyle: string, minY: number, maxY: number) => {
	canvas.width = vectorSize;
	canvas.height = vectorSize;

	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	ctx.font = `${fontStyle} ${vectorSize * .65}px ${font}`;
	ctx.textBaseline = "top";
	const textWidth = ctx.measureText(character).width;
	const x = (canvas.width - textWidth) / 2;
	ctx.fillText(character, x, 0);
	fs.writeFileSync(path.resolve(__dirname, `testchar.png`), canvas.toBuffer());
	// Crop the character to x - textWidth / 2, minY, x + textWidth / 2, maxY
	const tempCanvas = createCanvas(textWidth, maxY - minY);
	const tempCtx = tempCanvas.getContext('2d');
	tempCtx.fillStyle = 'rgba(255, 255, 255, 1)';
	tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
	tempCtx.drawImage(canvas, x, minY, textWidth, maxY - minY, 0, 0, textWidth, maxY - minY);
	canvas.width = textWidth;
	canvas.height = maxY - minY;
	ctx.drawImage(tempCanvas, 0, 0);

}

export function sanitizeCharacterName(char: string): string {
	const charMap: { [key: string]: string } = {
		'!': 'exclamation',
		'"': 'quote',
		'#': 'hash',
		'$': 'dollar',
		'%': 'percent',
		'&': 'and',
		'\'': 'apostrophe',
		'+': 'plus',
		'*': 'asterisk',
		'(': 'left_parenthesis',
		')': 'right_parenthesis',
		'{': 'left_brace',
		'}': 'right_brace',
		',': 'comma',
		'-': 'dash',
		'.': 'dot',
		'/': 'slash',
		':': 'colon',
		';': 'semicolon',
		'<': 'less_than',
		'=': 'equals',
		'>': 'greater_than',
		'?': 'question',
		'@': 'at',
		'\\': 'backslash',
		'_': 'underscore',
		'`': 'backtick',
		'|': 'pipe',
		'~': 'tilde',
		'[': 'left_bracket',
		']': 'right_bracket',
		'^': 'caret',
		'°': 'degree',
		'€': 'euro',
		'£': 'pound',
		'¥': 'yen',
		'§': 'section'
	};

	if (char.match(/[A-Z]/)) {
		return `UP_${char}`;
	} else if (char.match(/[a-z]/)) {
		return `LOW_${char}`;
	} else if (charMap[char]) {
		return charMap[char];
	} else if (char.match(/[0-9]/)) {
		return `NUM_${char}`;
	}
	return 'unknown';
}