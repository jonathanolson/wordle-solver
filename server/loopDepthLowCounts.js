
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess, loadGuessTotalTree } from './files.js';
import _ from 'lodash';
import { Ranking } from './wordleCompute.js';

// node --max-old-space-size=8192 server/loopDepthLowCounts.js

while ( true ) {
  const guesses = _.shuffle( getGuesses() );
  guesses.forEach( guess => {
    const counts = new Ranking( loadGuessTotalTree( guess ).ranking.counts ).totalGuessesScore();
    if ( counts < 8040 ) {
      if ( isLocked( guess ) ) {
        console.log( `skipping ${guess}, locked` );
        return;
      }

      createLock( guess );

      const guessNode = loadGuess( guess );
      console.log( guess );
      guessNode.depthOpen( 100, 1 );
      saveGuess( guessNode );

      deleteLock( guess );
    }
  } );
}
