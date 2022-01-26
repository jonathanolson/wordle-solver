
import guessWords from './guessWords.js';
import partition from './partition.js';
import targetWords from './targetWords.js';
import _ from 'lodash';

// node --max-old-space-size=8192 server/scanCoverings.js

const flatPartition = ( wordsArrays, guess ) => {
  const result = [];
  wordsArrays.forEach( words => {
    const partitions = partition( words, guess );
    result.push( ...Object.values( partitions ) );
  } );
  return result;
};

const pickPartitioningGuess = wordsArrays => {
  let bestGuess = null;
  let bestLargest = Number.POSITIVE_INFINITY;

  for ( let i = 0; i < guessWords.length; i++ ) {
    const guess = guessWords[ i ];
    i % 500 === 0 && console.log( `  ` + guess );
    const flat = flatPartition( wordsArrays, guess );
    let largest = 0;
    for ( let i = 0; i < flat.length; i++ ) {
      largest = Math.max( largest, flat[ i ].length );
    }
    if ( largest < bestLargest ) {
      bestLargest = largest;
      bestGuess = guess;
    }
  }

  return bestGuess;
};

const firstGuess = pickPartitioningGuess( [ targetWords ] );
console.log( 'first guess: ' + firstGuess );
const wordsArrayAfterFirst = flatPartition( [ targetWords ], firstGuess ).filter( a => a.length > 1 );
const secondGuess = pickPartitioningGuess( wordsArrayAfterFirst );
console.log( 'second guess: ' + secondGuess );
const wordsArrayAfterSecond = flatPartition( wordsArrayAfterFirst, secondGuess ).filter( a => a.length > 1 );
const thirdGuess = pickPartitioningGuess( wordsArrayAfterSecond );
console.log( 'third guess: ' + thirdGuess );
const wordsArrayAfterThird = flatPartition( wordsArrayAfterSecond, thirdGuess ).filter( a => a.length > 1 );
const fourthGuess = pickPartitioningGuess( wordsArrayAfterThird );
console.log( firstGuess, secondGuess, thirdGuess, fourthGuess ); // trace loins dumpy bight // aesir cloth boing amped

// console.log( flatPartition( flatPartition( flatPartition( flatPartition( [ targetWords ], 'aesir' ), 'cloth' ), 'boing' ), 'amped' ).filter( a => a.length > 1 ) );