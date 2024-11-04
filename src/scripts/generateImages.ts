import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, registerFont } from 'canvas';
import { getBounds } from '../app/extraction';
import { cropToBoundingBox, scaleImage, convertToGreyscale } from '../app/preprocess';
import { sanitizeCharacterName, printCharacter, printFamily } from './util';
import { vectorSize } from '../app/config';

const canvas = createCanvas(vectorSize, vectorSize);
const ctx = canvas.getContext('2d');

const characterData = fs.readFileSync(path.resolve(__dirname, '../data/characters-raw.txt'), 'utf8');
const characters = characterData.split(/\r?\n/);

const vectors: { character: string, pixelData: number[] }[] = [];

const getFonts = () => {
  const fontsPath = path.resolve(__dirname, '../fonts');
  const files = fs.readdirSync(fontsPath);
  const ttfFiles = files.filter(file => path.extname(file).toLowerCase() === '.ttf');
  const result = ttfFiles.map(file => ({ name: file.slice(0, -4), path: path.join(fontsPath, file) }));
  return result;
}

const registerFonts = async (fonts: { name: string, path: string }[]) => {
  fonts.forEach((font) => {
    registerFont(font.path, { family: font.name });
  });
}

function writeImageFile(canvas: any, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();

    stream.pipe(out);

    out.on('finish', () => resolve());
    out.on('error', (err) => reject(err));
  });
}

const fonts = getFonts();
console.log(`Found ${fonts.length} fonts. Registering fonts...`);
registerFonts(fonts);
console.log('Fonts registered. Generating reference vectors...');

(async () => {
  for (let fontIndex = 0; fontIndex < fonts.length; fontIndex++) {
    const font = fonts[fontIndex];
    const { canvas: familyCanvas, ctx: familyCtx } = printFamily(font.name, "normal", vectorSize, characters);
    const { minY, maxY } = getBounds(familyCanvas, familyCtx);
    console.log(`Family saved as ${font.name}-family.png minY: ${minY}, maxY: ${maxY}`);

    for (let characterIndex = 0; characterIndex < characters.length; characterIndex++) {
      const character = characters[characterIndex];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      printCharacter(canvas, ctx, character, font.name, "normal", vectorSize);
      convertToGreyscale(canvas, ctx);
      scaleImage(canvas, ctx, vectorSize, vectorSize);
      const sanitizedCharacter = sanitizeCharacterName(character);
      const characterDir = path.resolve(__dirname, `../data/characters/${sanitizedCharacter}`);
      if (!fs.existsSync(characterDir)) {
        fs.mkdirSync(characterDir, { recursive: true });
      }
      const characterPath = path.resolve(characterDir, `${sanitizedCharacter}_${fontIndex}.png`);
      await writeImageFile(canvas, characterPath);
      console.log(`Character ${character} saved as ${characterPath}`);
    };
  };
})();

console.log('Character images generated and saved');
