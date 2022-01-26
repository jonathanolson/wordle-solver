
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess, loadGuessTree } from './files.js';
import _ from 'lodash';
import { Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/loopExtraLowCounts.js

while ( true ) {
  const guesses = _.shuffle( getGuesses() );
  guesses.forEach( guess => {
    const counts = loadGuessTree( guess ).ranking.counts;
    if ( counts.length === 5 && counts[ 4 ] < 30 ) {
      if ( isLocked( guess ) ) {
        console.log( `skipping ${guess}, locked` );
        return;
      }

      createLock( guess );

      const guessNode = loadGuess( guess );
      console.log( guess );
      guessNode.targetedOpenTo( 4, { 3: 10000, 2: 10 }, 100, new Heuristic() );
      saveGuess( guessNode );

      deleteLock( guess );
    }
  } );
}
