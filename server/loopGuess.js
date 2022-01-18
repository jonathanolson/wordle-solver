
import { loadGuess, isLocked, createLock, deleteLock, saveGuess } from './files.js';

// node --max-old-space-size=8192 server/loopGuess.js

// while ( true ) {
  [ 'rance', 'alter', 'rated', 'crate', 'trace', 'slate' ].forEach( guess => {
    if ( isLocked( guess ) ) {
      console.log( `skipping ${guess}, locked` );
      return;
    }

    createLock( guess );

    const guessNode = loadGuess( guess );

    console.log( guess );
    guessNode.depthFix( 100, 1 );
    saveGuess( guessNode );

    deleteLock( guess );
  } );
// }
