import { createLock, deleteLock, isLocked, loadGuess, saveGuess } from './files.js';
import fs from 'fs';
import { Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/importCompact.js someFile

const filename = process.argv[ 2 ];

const fileContents = fs.readFileSync( filename, 'utf-8' );
const data = JSON.parse( fileContents );
const compact = data.compact;
const changed = JSON.parse( compact.replace( /,/g, '","' ).replace( /\[/g, '["' ).replace( /\]/g, '"]' ).replace( /\]"/g, ']' ).replace( /"\[/g, '[' ) );
const guess = changed[ 0 ];

const paths = [];
const recur = ( tree, current ) => {
  paths.push( [ ...current, tree[ 0 ] ] );
  tree[ 1 ].forEach( x => other( x, [ ...current, tree[ 0 ] ] ) );
};
const other = ( tree, current ) => {
  if ( typeof tree === 'string' ) {
    paths.push( [ ...current, tree ] );
  }
  else if ( typeof tree[ 0 ] === 'string' && typeof tree[ 1 ] === 'string' ) {
    paths.push( [ ...current, tree[ 0 ], tree[ 1 ] ] );
  }
  else {
    recur( tree, current );
  }
};
recur( changed, [] );
// console.log( JSON.stringify( changed ) );
// console.log( paths );

if ( !isLocked( guess ) ) {
  createLock( guess );

  const guessNode = loadGuess( guess );

  paths.forEach( guesses => {
    console.log( guesses );
    guessNode.openGuesses( guesses, new Heuristic() );
  } );
  saveGuess( guessNode );

  deleteLock( guess );
}
else {
  console.log( `skipping ${guess}, locked` );
}

