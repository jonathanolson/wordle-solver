
import scanGuess from './scanGuess.js';
import guessWords from './guessWords.js';
import targetWords from './targetWords.js';
import { GuessOption } from './wordleCompute.js';
import { fastPartition } from './wordleCore.js';

// node --max-old-space-size=8192 server/scanGuesses.js

const stride = Number.parseInt( process.argv[ 2 ], 10 );
const start = Number.parseInt( process.argv[ 3 ], 10 );

const options = [];
for ( let i = 0; i < guessWords.length; i++ ) {
  const guess = guessWords[ i ];
  const map = fastPartition( targetWords, guess );
  let size = 0;
  let count = 0;
  let best = 0;
  for ( const score in map ) {
    const length = map[ score ].length;
    best = Math.max( best, length );
    count += 1;
    size += length;
  }
  size = size / ( count * 0.01 ) + best; // average length weighted in as a third
  options.push( new GuessOption( guess, map, size ) );
}
options.sort( GuessOption.compare );

for ( let i = start; i < options.length; i += stride ) {
  const guess = options[ i ].guess;
  console.log( `${i} ${guess}` );
  if ( scanGuess( guess ) ) {
    throw new Error( 'HOLY FUCKBALLS IT WORKED' );
  }
}
