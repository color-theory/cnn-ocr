# simple-ocr-test
My first attempt at OCR.

It should take an image and parse out readable characters from top to bottom,
left to right and return the value as a string.

## Warning
This is a naive approach created for learning purposes. If you need a proper OCR library, it would be wise to look elsewhere.

## Setup
You must first generate your reference vectors for each character. Add some ttf fonts to your `fonts` directory. Then
```js
> npm run generate-vectors
```

You'll probably want to verify that they have been created and test properly against themselves. Expect one or two incorrect guesses.
```js
> npm run test-vectors
```

#### Spell Checker
This project requires another project, the spell checker, to run by default. If you do not
wish to use that project, there is an npm script that runs with the checker disabled. Otherwise,
please download and run the server here before continuing.

https://github.com/color-theory/spell-check

## Usage
```js
> npm run ocr -- {Path to your image}
```

Or to run with spell checker disabled:

```js
> npm run ocr -- --no-spell {Path to your image}
```

