import { createLock, deleteLock, isLocked, loadGuess, saveGuess } from './files.js';
import fs from 'fs';
import { Heuristic } from './wordleCompute.js';

// node --max-old-space-size=8192 server/import.js someFile

const filename = process.argv[ 2 ];

const fileContents = fs.readFileSync( filename, 'utf-8' );
const lines = fileContents.trim().split( '\n' ).map( line => line.trim() );
const guess = lines[ 0 ].split( ',' )[ 0 ];

if ( !isLocked( guess ) ) {
  createLock( guess );

  const guessNode = loadGuess( guess );

  lines.forEach( line => {
    console.log( line );
    const guesses = line.split( ',' );
    guessNode.openGuesses( guesses, new Heuristic() );
  } );
  saveGuess( guessNode );

  deleteLock( guess );
}
else {
  console.log( `skipping ${guess}, locked` );
}

