
import { loadGuess, isLocked, createLock, deleteLock, saveGuess } from './files.js';

// node --max-old-space-size=8192 server/loopGuess.js

while ( true ) {
  const guess = 'rants';
  if ( isLocked( guess ) ) {
    console.log( `skipping ${guess}, locked` );
    continue;
  }

  createLock( guess );

  const guessNode = loadGuess( guess );

  while ( true ) {
    for ( let i = 0; i < 10; i++ ) {
      console.log( guess );
      guessNode.targetedOpenTo( 4, { 3: 1000000, 2: 0 }, 7, 100, 1 );
    }
    saveGuess( guessNode );
  }

  deleteLock( guess );
}
