
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';
import _ from 'lodash';
import { Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/loopWide.js

while ( true ) {
  const guesses = _.shuffle( getGuesses() );
  guesses.forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );
    console.log( guess );
    guessNode.targetedOpenTo( 4, { 3: 50, 2: 10 }, 100, new Heuristic() );
    saveGuess( guessNode );

    deleteLock( guess );
  } );
}
