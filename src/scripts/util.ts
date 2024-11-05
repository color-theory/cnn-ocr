import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { Font } from 'fontkit';
import { vectorSize, fontSize } from '../app/config';

export const printFamily = (font: Font, vectorSize: number, characters: string[]) => {
	const canvas = createCanvas(vectorSize, vectorSize);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	characters.forEach((character: string) => {
		const glyphRun = font.layout(character);
		glyphRun.glyphs.forEach(glyph => {
			// @ts-ignore
			glyph.render(ctx, fontSize);
		});
	});

	return { canvas, ctx };
}

export const printCharacter = (canvas: Canvas, ctx: CanvasRenderingContext2D, character: string, font: Font, minY: number, maxY: number) => {
	canvas.width = vectorSize;
	canvas.height = vectorSize;

	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	let advanceWidth = 0;
	const ascent = (font.ascent / font.unitsPerEm) * fontSize;
	const descent = (font.descent / font.unitsPerEm) * fontSize;
	const textHeight = ascent - descent;

	ctx.scale(1, -1);
	ctx.translate(0, -ascent);
	font.layout(character).glyphs.forEach(glyph=>{
		ctx.translate(advanceWidth, 0);
		// @ts-ignore
		glyph.render(ctx, fontSize)
		advanceWidth += ((glyph.advanceWidth / font.unitsPerEm) * fontSize);
	})
	const tempCanvas = createCanvas(advanceWidth, textHeight);
	const tempCtx = tempCanvas.getContext('2d');
	tempCtx.fillStyle = 'rgba(255, 255, 255, 1)';
	tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
	tempCtx.drawImage(canvas, 0, 0);
	//fs.writeFileSync(path.resolve(__dirname, `testchar.png`), tempCanvas.toBuffer());
	canvas.width = advanceWidth;
	canvas.height = textHeight;
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