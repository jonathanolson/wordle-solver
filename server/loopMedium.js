
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';

// node --max-old-space-size=8192 server/loopMedium.js

while ( true ) {
  const guesses = getGuesses();
  guesses.forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );
    if ( guessNode.computationNodeCount( 3 ) <= 8 ) {
      console.log( guess );
      guessNode.targetedOpenTo( 4, { 3: 20, 2: 0 }, 100, 100, 1 );
      saveGuess( guessNode );
    }

    deleteLock( guess );
  } );
}
