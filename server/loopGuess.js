
import { loadGuess, isLocked, createLock, deleteLock, saveGuess } from './files.js';
import { Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/loopGuess.js

while ( true ) {
  [ 'salet' ].forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );

    console.log( guess );
    guessNode.depthOpen( new Heuristic() );
    saveGuess( guessNode );

    deleteLock( guess );
  } );
}
