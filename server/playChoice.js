
import prompt from 'prompt';
import { load } from './files.js';
import print from './print.js';
import { Ranking } from './wordleCompute.js';

// We might go over this in memory
// node --max-old-space-size=8192 server/playChoice.js

const metric = process.argv[ 2 ] === 'total' ? Ranking.totalGuessesMetric : Ranking.minimizeLongestMetric;

( async () => {
  const root = load();

  let node = root;

  prompt.start();

  while ( true ) {
    if ( typeof node === 'string' ) {
      console.log( node );
      break;
    }
    else {
      const items = node.guessNodes.map( n => ( { guess: n, tree: n.createTree( metric ) } ) );
      items.sort( ( a, b ) => metric( a.tree.ranking, b.tree.ranking ) );
      print( items.map( item => ( {
        guess: item.guess.guess,
        ranking: item.tree.ranking.counts,
        misses: typeof item.guess.map[ '00000' ] !== 'object' ? item.guess.map[ '00000' ] : item.guess.map[ '00000' ].createTree().ranking.counts
      } ) ) );

      const { guess } = await prompt.get( [ 'guess' ] );
      const guessNode = node.guessNodes.filter( n => n.guess === guess )[ 0 ];
      const { score } = await prompt.get( [ 'score' ] );

      node = guessNode.map[ score ];
    }
  }
} )();
