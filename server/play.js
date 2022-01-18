
import prompt from 'prompt';
import { loadTree } from './files.js';
import { Ranking } from './wordleCompute.js';

// node --max-old-space-size=8192 server/play.js

const metric = process.argv[ 2 ] === 'total' ? Ranking.totalGuessesMetric : Ranking.minimizeLongestMetric;

( async () => {
  const tree = loadTree( metric );

  let node = tree;

  prompt.start();

  while ( true ) {
    if ( typeof node === 'string' ) {
      console.log( node );
      break;
    }
    else {
      console.log( node.guess );
      console.log( node.ranking.counts );

      const { score } = await prompt.get( [ 'score' ] );

      node = node.map[ score ];
    }
  }
} )();
