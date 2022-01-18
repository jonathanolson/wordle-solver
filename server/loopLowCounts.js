
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';
import _ from 'lodash';

// node --max-old-space-size=8192 server/loopLowCounts.js

while ( true ) {
  const guesses = _.shuffle( getGuesses() );
  guesses.forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );
    const counts = guessNode.createTree().ranking.totalGuessesScore();
    if ( counts < 8200 ) {
      console.log( guess );
      // Temporary
      guessNode.targetedOpenTo( 4, { 3: 500, 2: 0 }, 100, 100, 1 );
      saveGuess( guessNode );
    }

    deleteLock( guess );
  } );
}
