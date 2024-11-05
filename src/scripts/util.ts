import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';

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

export const printCharacter = (canvas: Canvas, ctx: CanvasRenderingContext2D, character: string, font: string, fontStyle: string, vectorSize: number) => {
	const canvasSize = vectorSize;

	canvas.width = canvasSize;
	canvas.height = canvasSize;

	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	ctx.font = `${fontStyle} ${canvasSize * .65}px ${font}`;
	ctx.textBaseline = "alphabetic"
	const textWidth = ctx.measureText(character).width;
	const x = (canvasSize - textWidth) / 2;
	const y = 0;
	ctx.fillText(character, x, y);
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
	}
	return 'unknown';
}