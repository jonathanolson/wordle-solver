
import { load, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';
import guessWords from './guessWords.js';
import { GuessNode, Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/loopOpen.js

const fakeRoot = load( false );
const options = fakeRoot.getOptions( new Heuristic() );


for ( let i = 0; i < options.length; i++ ) {
  const guess = options[ i ].guess;
  const usedGuesses = getGuesses();
  if ( usedGuesses.includes( guess ) ) {
    continue;
  }
  if ( isLocked( guess ) ) {
    continue;
  }

  console.log( `creating ${guess}` );

  createLock( guess );

  const guessNode = new GuessNode( options[ i ], [ guess ], guessWords, false, new Heuristic() );
  saveGuess( guessNode );

  deleteLock( guess );
}
