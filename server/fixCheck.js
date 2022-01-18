
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess, loadGuessTree } from './files.js';
import _ from 'lodash';

// node --max-old-space-size=8192 server/fixCheck.js

const ranceTree = loadGuess( 'rance' );

const comp1 = ranceTree.map[ '22101' ];
comp1.openNext( 100, 1 );

console.log( comp1 );
