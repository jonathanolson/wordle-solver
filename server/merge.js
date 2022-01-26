
import { getGuesses, loadGuess, saveGuess } from './files.js';
import _ from 'lodash';

// node --max-old-space-size=8192 server/merge.js

const aDir = './computed/wordle/';
const bDir = './computed/wordle5/';

const aGuesses = getGuesses( aDir );
const bGuesses = getGuesses( bDir );

const guesses = _.uniq( [ ...aGuesses, ...bGuesses ] );

guesses.forEach( guess => {
  const inA = aGuesses.includes( guess );
  const inB = bGuesses.includes( guess );

  if ( inA && inB ) {
    saveGuess( loadGuess( guess, aDir ).merge( loadGuess( guess, bDir ) ), aDir );
  }
  else if ( inB ) {
    saveGuess( loadGuess( guess, bDir ), aDir );
  }
} );
