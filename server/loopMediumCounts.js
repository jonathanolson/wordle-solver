
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';

// node --max-old-space-size=8192 server/loopMediumCounts.js

while ( true ) {
  const guesses = getGuesses();
  guesses.forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );
    const counts = guessNode.createTree().ranking.counts;
    if ( counts.length === 5 && counts[ 4 ] < 80 ) {
      console.log( guess );
      guessNode.targetedOpenTo( 4, { 3: 20, 2: 0 }, 100, 100, 1 );
      saveGuess( guessNode );
    }

    deleteLock( guess );
  } );
}
