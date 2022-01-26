
import fs from 'fs';
import guessWords from './guessWords.js';
import targetWords from './targetWords.js';
import { ComputationNode, GuessNode, Ranking } from './wordleCompute.js';
import { IS_HARD_MODE } from './wordleCore.js';

// let files; import( './server/files.js' ).then( f => { files = f } );
// let core; import( './server/wordleCore.js' ).then( f => { core = f } );
// let guessWords; import( './server/guessWords.js' ).then( f => { guessWords = f } );
// let g = files.loadGuess( 'artel' );
// g.map[ '00000' ].guessNodes[10].map[ '10000' ]
// g.map[ '00000' ].guessNodes[10].map[ '10000' ]
// for ( let i = 0; i < guessWords.length; i++ ) { const guessWord = guessWords[ i ]; } g.map[ '00000' ].guessNodes[10].map[ '10000' ]

// (() => {
//   const words = [
//     'pushy', 'musky',
//     'husky', 'bushy',
//     'hussy', 'humus',
//     'mushy', 'gypsy',
//     'fussy'
//   ];
//   for ( let i = 0; i < guessWords.length; i++ ) {
//     const guessWord = guessWords[ i ];
//     if ( core.fastDoesFullyPartition( words, guessWord ) ) {
//       console.log( guessWord );
//     }
//   }
// });

const saveDirectory = `./computed/${IS_HARD_MODE ? 'wordle-hard' : 'wordle'}/`;

const getGuessFile = ( guess, directory = saveDirectory ) => {
  return `${directory}${guess}.json`;
};
const getGuessTreeFile = ( guess, directory = saveDirectory ) => {
  return `${directory}${guess}.tree.json`;
};
const getGuessTotalTreeFile = ( guess, directory = saveDirectory ) => {
  return `${directory}${guess}.tree.total.json`;
};
const getGuessHardTreeFile = ( guess, directory = saveDirectory ) => {
  return `${directory}${guess}.tree.hard.json`;
};

const save = root => {
  saveRoot( root );
};
const load = ( loadGuesses = true ) => {
  const root = new ComputationNode( targetWords, [], guessWords, true );

  if ( loadGuesses ) {
    getGuesses().forEach( guess => {
      root.guessNodes.push( loadGuess( guess ) );
    } );
  }
  root.depth = 4; // for now!

  return root;
};

const saveRoot = root => {
  if ( !root ) {
    throw new Error( 'no root' );
  }
  root.guessNodes.forEach( saveGuess );
};
const saveGuess = ( guessNode, directory = saveDirectory ) => {
  console.log( `saving ${guessNode.guess}` );
  fs.writeFileSync( getGuessFile( guessNode.guess, directory ), JSON.stringify( guessNode.serialize() ) );
  if ( IS_HARD_MODE ) {
    fs.writeFileSync( getGuessHardTreeFile( guessNode.guess, directory ), JSON.stringify( guessNode.createLimitedTree() ) );
  }
  else {
    fs.writeFileSync( getGuessTreeFile( guessNode.guess, directory ), JSON.stringify( guessNode.createTree( Ranking.minimizeLongestMetric ) ) );
    fs.writeFileSync( getGuessTotalTreeFile( guessNode.guess, directory ), JSON.stringify( guessNode.createTree( Ranking.totalGuessesMetric ) ) );
  }
};
const loadGuess = ( guess, directory = saveDirectory ) => {
  console.log( `loading ${guess}` );
  return GuessNode.deserialize( JSON.parse( fs.readFileSync( getGuessFile( guess, directory ), 'utf-8' ) ) );
};
const loadGuessTree = ( guess, directory = saveDirectory ) => {
  return JSON.parse( fs.readFileSync( getGuessTreeFile( guess, directory ), 'utf-8' ) );
};
const loadGuessTotalTree = ( guess, directory = saveDirectory ) => {
  return JSON.parse( fs.readFileSync( getGuessTotalTreeFile( guess, directory ), 'utf-8' ) );
};
const loadGuessHardTree = ( guess, directory = saveDirectory ) => {
  return JSON.parse( fs.readFileSync( getGuessHardTreeFile( guess, directory ), 'utf-8' ) );
};
const getGuesses = ( directory = saveDirectory ) => {
  return fs.readdirSync( directory ).filter( file => {
    return file.endsWith( '.json' ) && !file.includes( '.tree.' );
  } ).map( file => file.slice( 0, -( '.json'.length ) ) );
};
const loadTree = ( metric = Ranking.minimizeLongestMetric ) => {
  const guesses = getGuesses();
  const trees = guesses.map( guess => metric === Ranking.minimizeLongestMetric ? loadGuessTree( guess ) : loadGuessTotalTree( guess ) );
  let bestTree = trees[ 0 ];
  for ( let i = 1; i < trees.length; i++ ) {
    const tree = trees[ i ];
    if ( metric( new Ranking( tree.ranking.counts ), new Ranking( bestTree.ranking.counts ) ) < 0 ) {
      bestTree = tree;
    }
  }
  return bestTree;
};
const loadSortedTrees = ( metric = Ranking.minimizeLongestMetric ) => {
  const guesses = getGuesses();
  const trees = guesses.map( guess => {
    if ( IS_HARD_MODE ) {
      return loadGuessHardTree( guess );
    }
    return metric === Ranking.minimizeLongestMetric ? loadGuessTree( guess ) : loadGuessTotalTree( guess );
  } ).filter( tree => tree !== null );
  trees.sort( ( a, b ) => {
    return metric( new Ranking( a.ranking.counts ), new Ranking( b.ranking.counts ) );
  } );
  return trees;
};
const createLock = guess => {
  fs.closeSync( fs.openSync( `${saveDirectory}${guess}.lock`, 'w' ) );
};
const isLocked = guess => {
  return fs.existsSync( `${saveDirectory}${guess}.lock` );
};
const deleteLock = guess => {
  fs.unlinkSync( `${saveDirectory}${guess}.lock` );
};

export { save, load, saveGuess, loadGuess, getGuesses, saveRoot, loadGuessTree, loadGuessTotalTree, loadGuessHardTree, loadTree, loadSortedTrees, createLock, isLocked, deleteLock };

// getGuesses().forEach( guess => {
//   saveGuess( loadGuess( guess ) );
// } );
