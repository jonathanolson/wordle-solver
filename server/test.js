import { loadGuess, loadGuessHardTree } from './files.js';
import guessWords from './guessWords.js';
import partition from './partition.js';
import targetWords from './targetWords.js';
import { GuessNode, GuessOption, Heuristic, Ranking } from './wordleCompute.js';

// node --max-old-space-size=8192 server/test.js

const tree = loadGuessHardTree( 'salet' );
// const guess = 'salet';
// const guessNode = loadGuess( guess );
// const tree = guessNode.createLimitedTree();
console.log( tree.ranking.counts, new Ranking( tree.ranking.counts ).totalGuessesScore() );
