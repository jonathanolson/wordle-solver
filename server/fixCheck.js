
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess, loadGuessTree, loadGuessTotalTree } from './files.js';
import _ from 'lodash';

// node --max-old-space-size=8192 server/fixCheck.js

// const ranceTree = loadGuess( 'rance' );
//
// const comp1 = ranceTree.map[ '22101' ];
// comp1.openNext( new Heuristic() );
//
// console.log( comp1 );

const tree = loadGuessTotalTree( 'crate' );

const recur = ( subtree, guesses ) => {
  if ( typeof subtree === 'string' ) {
    guesses = [ ...guesses, subtree ];
  }
  else {
    guesses = [ ...guesses, subtree.guess ];
  }
  if ( guesses.length === 5 ) {
    console.log( guesses );
  }
  if ( subtree.map ) {
    for ( const key in subtree.map ) {
      recur( subtree.map[ key ], guesses );
    }
  }
};
recur( tree, [] );
