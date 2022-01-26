
import { loadGuess, getGuesses, isLocked, createLock, deleteLock, saveGuess } from './files.js';
import _ from 'lodash';
import guessWords from './guessWords.js';
import partition from './partition.js';
import targetWords from './targetWords.js';
import { Heuristic, Ranking } from './wordleCompute.js';
import { isHardModeValid, score as computeScore } from './wordleCore.js';

// node --max-old-space-size=8192 server/hardTest.js

// const scoreMap = {};
//
// console.log( 'computing score map' );
// targetWords.forEach( ( targetWord, i ) => {
//   i % 100 === 0 && console.log( `${i} of ${targetWords.length}` );
//   scoreMap[ targetWord ] = {};
//   guessWords.forEach( guessWord => {
//     scoreMap[ targetWord ][ guessWord ] = computeScore( targetWord, guessWord );
//   } );
// } );
//
// const partitionLookup = ( words, guess ) => {
//   const map = {};
//   let maxCount = 0;
//   for ( let i = 0; i < words.length; i++ ) {
//     const word = words[ i ];
//     const match = scoreMap[ word ][ guess ];
//     let list = map[ match ];
//     if ( !list ) {
//       list = map[ match ] = [];
//     }
//     list.push( word );
//     maxCount = Math.max( maxCount, list.length );
//   }
//   return {
//     map: map,
//     maxCount: maxCount
//   };
// };

// guesses includes guess, returns tree or null (if no possible result)
const recur = ( guess, guesses, possibleWords, possibleGuesses ) => {
  const len = guesses.length;

  if ( len < 4 ) {
    console.log( guesses );
  }
  if ( len === 5 && possibleWords.length > 1 ) {
    return null;
  }
  if ( len === 4 && possibleWords.length > 243 ) {
    return null;
  }

  // const parts = partitionLookup( possibleWords, guess );
  const partsMap = partition( possibleWords, guess );
  // if ( len === 5 && parts.maxCount > 1 ) {
  //   return null;
  // }
  // if ( len === 4 && parts.maxCount > 243 ) {
  //   return null;
  // }

  // const partsMap = parts.map;
  const map = {};
  let totalScore = 0;

  for ( const score in partsMap ) {
    const subPossibleWords = partsMap[ score ];

    if ( score === '22222' ) {
      totalScore += len;
    }
    else if ( subPossibleWords.length === 1 ) {
      map[ score ] = subPossibleWords[ 0 ];
      totalScore += len + 1;
    }
    else if ( subPossibleWords.length === 2 ) {
      map[ score ] = {
        guess: subPossibleWords[ 0 ],
        map: {
          22222: subPossibleWords[ 0 ],
          // [ scoreMap[ subPossibleWords[ 1 ] ][ subPossibleWords[ 0 ] ] ]: subPossibleWords[ 1 ]
          [ computeScore( subPossibleWords[ 1 ], subPossibleWords[ 0 ] ) ]: subPossibleWords[ 1 ]
        },
        totalScore: ( len + 1 ) + ( len + 2 )
      };
    }
    else {
      const subPossibleGuesses = possibleGuesses.filter( word => isHardModeValid( word, guess, score ) );

      let best = null;

      for ( let i = 0; i < subPossibleGuesses.length; i++ ) {
        const subGuess = subPossibleGuesses[ i ];
        const sub = recur( subGuess, [ ...guesses, subGuess ], subPossibleWords, subPossibleGuesses );

        if ( sub && ( !best || sub.ranking < best.ranking ) ) {
          best = sub;
        }
      }

      if ( !best ) {
        return null;
      }
    }
  }

  return {
    guess: guess,
    map: map,
    totalScore: totalScore
  };
};

// TODO: generate rankings


console.log( JSON.stringify( recur( 'salet', [ 'salet' ], targetWords, guessWords.slice().sort() ) ) );