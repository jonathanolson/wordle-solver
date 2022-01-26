import { loadGuessTotalTree } from './files.js';
import targetWords from './targetWords.js';
import { score } from './wordleCore.js';
import _ from 'lodash';

// node --max-old-space-size=8192 server/export.js salet > salet.txt

// const metric = process.argv[ 2 ] === 'total' ? Ranking.totalGuessesMetric : Ranking.minimizeLongestMetric;

const guess = process.argv[ 2 ] || 'salet';

const tree = loadGuessTotalTree( guess );

targetWords.slice().sort().forEach( word => {
  const guesses = [];
  let subtree = tree;
  while ( subtree ) {
    if ( typeof subtree === 'string' ) {
      guesses.push( subtree );
      console.log( guesses.toString() );
      return;
    }
    else {
      guesses.push( subtree.guess );
      subtree = subtree.map[ score( word, subtree.guess ) ];
    }
  }
} );
