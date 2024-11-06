import * as fs from 'fs';
import * as path from 'path';
import { openSync, Font} from 'fontkit';
import { createCanvas, registerFont } from 'canvas';
import { getBounds } from '../app/extraction';
import { scaleImage, convertToGreyscale } from '../app/preprocess';
import { sanitizeCharacterName, printCharacter, printFamily } from './util';
import { vectorSize } from '../app/config';
import { binarize } from '../app/preprocess/otsu';

const canvas = createCanvas(vectorSize, vectorSize);
const ctx = canvas.getContext('2d');

const characterData = fs.readFileSync(path.resolve(__dirname, '../data/characters-raw.txt'), 'utf8');
const characters = characterData.split(/\r?\n/);

const getFonts = () => {
  const fontsPath = path.resolve(__dirname, '../fonts');
  const files = fs.readdirSync(fontsPath);
  const ttfFiles = files.filter(file => path.extname(file).toLowerCase() === '.ttf');
  const result = ttfFiles.map((file) => {
    const font: Font = openSync(path.join(fontsPath, file)) as Font;
    return font;
  });
  return result;
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
console.log(`Found ${fonts.length} fonts.`);
(async () => {
  for (let fontIndex = 0; fontIndex < fonts.length; fontIndex++) {
    const font = fonts[fontIndex];
    console.log(`loading font ${font.familyName}`);
    const { canvas: familyCanvas, ctx: familyCtx } = printFamily(font, vectorSize, characters);
    const { minY, maxY } = getBounds(familyCanvas, familyCtx);
    console.log(`Family measured as ${font.familyName}-family.png minY: ${minY}, maxY: ${maxY}`);
    for (let characterIndex = 0; characterIndex < characters.length; characterIndex++) {
      const character = characters[characterIndex];
      
      let skip = false;
      for(let i = 0; i < character.length; i++ ){
        if(!font.hasGlyphForCodePoint(character.charCodeAt(i))){
          console.log(` --- Glyph does not exist in this font. Skipping character ${character}.`);
          skip = true;
          break;
        }
      }
      if(skip) continue;
      
      console.log(`Generating image for character ${character} with font ${font.familyName}`);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      console.log(`registering font ${font.familyName} as font ${font.familyName}`);
      printCharacter(canvas, ctx, character, font, minY, maxY);
      scaleImage(canvas, ctx);
      convertToGreyscale(canvas, ctx);
      binarize(canvas,ctx);
      const sanitizedCharacter = sanitizeCharacterName(character);
      const characterDir = path.resolve(__dirname, `../data/characters/${sanitizedCharacter}`);
      if (!fs.existsSync(characterDir)) {
        fs.mkdirSync(characterDir, { recursive: true });
      }
      const characterPath = path.resolve(characterDir, `${sanitizedCharacter}_${fontIndex}.png`);
      await writeImageFile(canvas, characterPath);
      fs.appendFileSync( path.resolve(__dirname, "../data/labels.csv"),`${character}\t${path.resolve(characterDir, `${sanitizedCharacter}_${fontIndex}.png\n`)}`);
      console.log(`Character ${character} saved as ${characterPath}`);
    };
  };
})();

console.log('Character images generated and saved');
