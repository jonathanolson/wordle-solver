
import prompt from 'prompt';
import guessWords from './guessWords.js';
import partition from './partition.js';
import targetWords from './targetWords.js';
import { score } from './wordleCore.js';

// node --max-old-space-size=8192 server/screwAdversary.js

const target = 'axiom';

( async () => {
  prompt.start();

  let words = targetWords.slice();

  const pastGuesses = [];

  while ( true ) {
    let guess = null;
    let amount = Number.POSITIVE_INFINITY;
    const len = arr => arr ? arr.length : 0;
    guessWords.forEach( potentialGuess => {
      if ( pastGuesses.includes( potentialGuess ) ) {
        return;
      }
      const part = partition( words, potentialGuess );
      const desiredScore = score( target, potentialGuess );
      const newWords = part[ desiredScore ];
      const wordAmount = len( newWords );
      const maxWordAmount = Math.max( ...Object.values( part ).map( arr => arr === newWords ? 0 : len( arr ) ) );
      if ( wordAmount > 0 && wordAmount < amount && ( maxWordAmount < wordAmount || words.length === 2 ) ) {
        guess = potentialGuess;
        amount = wordAmount;
      }
    } );
    console.log( guess, score( target, guess ), words.slice( 0, 10 ) );
    pastGuesses.push( guess );

    // const { resultScore } = await prompt.get( [ 'resultScore' ] );
    const resultScore = score( target, guess );

    words = words.filter( word => resultScore === score( word, guess ) );

    if ( words.length === 1 ) {
      return;
    }

    if ( !words.includes( target ) ) {
      console.log( 'uncontained' );
      return;
    }
  }
} )();
