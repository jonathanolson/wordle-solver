
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';
import { Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/loopFine.js

while ( true ) {
  const guesses = getGuesses();
  guesses.forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );
    if ( guessNode.computationNodeCount( 3 ) <= 6 ) {
      console.log( guess );
      guessNode.targetedOpenTo( 4, { 3: 150, 2: 0 }, 100, new Heuristic() );
      saveGuess( guessNode );
    }

    deleteLock( guess );
  } );
}
