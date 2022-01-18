import { loadSortedTrees } from './files.js';
import print from './print.js';
import targetWords from './targetWords.js';
import { Ranking } from './wordleCompute.js';

const metric = process.argv[ 2 ] === 'total' ? Ranking.totalGuessesMetric : Ranking.minimizeLongestMetric;

const trees = loadSortedTrees( metric );

const status = () => {
  print( trees.map( tree => {
    return {
      g: tree.guess,
      c: new Ranking( tree.ranking.counts ).totalGuessesScore(),
      r: tree.ranking.counts.toString(),
      p: +( ( new Ranking( tree.ranking.counts ).totalGuessesScore() / targetWords.length ).toFixed( 5 ) )
    };
  } ) );
};
export default status;

if ( import.meta.url === `file://${process.argv[ 1 ]}` ) {
  // module was not imported but called directly
  status();
}