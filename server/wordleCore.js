const IS_HARD_MODE = true;
const LENGTH = 5;
const ABSENT = 0;
const PRESENT = 1;
const CORRECT = 2;
const scratchResult = [ ABSENT, ABSENT, ABSENT, ABSENT, ABSENT ];
const scratchIncorrect = [ true, true, true, true, true ];
const scratchUnused = [ true, true, true, true, true ];
const score = ( correctSolution, attempt ) => {
  const result = scratchResult.fill( ABSENT ); // indexed by attempt
  const incorrect = scratchIncorrect.fill( true ); // indexed by correctSolution
  const unused = scratchUnused.fill( true ); // indexed by attempt

  for ( let i = 0; i < LENGTH; i++ ) {
    if ( correctSolution[ i ] === attempt[ i ] ) {
      result[ i ] = CORRECT;
      incorrect[ i ] = false;
      unused[ i ] = false;
    }
  }

  for ( let i = 0; i < LENGTH; i++ ) {
    if ( incorrect[ i ] ) {
      const correctLetter = correctSolution[ i ];
      for ( let k = 0; k < LENGTH; k++ ) {
        if ( unused[ k ] && correctLetter === attempt[ k ] ) {
          result[ k ] = PRESENT;
          unused[ k ] = false;
          break;
        }
      }
    }
  }

  return encode( result );
};
const encode = array => {
  // lazy for now
  return array.join( '' );
};
const perfectScore = encode( [ CORRECT, CORRECT, CORRECT, CORRECT, CORRECT ] );
const decode = string => {
  for ( let i = 0; i < LENGTH; i++ ) {
    const char = string[ i ];
    scratchResult[ i ] = char === '0' ? ABSENT : ( char === '1' ? PRESENT : CORRECT );
  }
  return scratchResult;
};
const isHardModeValid = ( nextGuess, previousGuess, previousScore ) => {
  for ( let i = 0; i < LENGTH; i++ ) {
    if ( previousScore[ i ] === '2' && nextGuess[ i ] !== previousGuess[ i ] ) {
      return false;
    }
  }
  // Avoid object allocation?
  for ( let i = 0; i < LENGTH; i++ ) {
    if ( previousScore[ i ] === '0' ) {
      continue;
    }

    const letter = previousGuess[ i ];

    // Count in both words
    let previousCount = 0;
    let nextCount = 0;
    for ( let j = 0; j < LENGTH; j++ ) {
      if ( previousGuess[ j ] === letter && previousScore[ j ] !== '0' ) {
        previousCount++;
      }
      if ( nextGuess[ j ] === letter ) {
        nextCount++;
      }
    }
    if ( nextCount < previousCount ) {
      return false;
    }
  }
  return true;
};

const fastScore = ( correctSolution, attempt ) => {
  const result = scratchResult; // indexed by attempt
  const incorrect = scratchIncorrect; // indexed by correctSolution
  const unused = scratchUnused; // indexed by attempt

  for ( let i = 0; i < LENGTH; i++ ) {
    if ( correctSolution[ i ] === attempt[ i ] ) {
      result[ i ] = CORRECT;
      incorrect[ i ] = false;
      unused[ i ] = false;
    }
    else {
      result[ i ] = ABSENT;
      incorrect[ i ] = true;
      unused[ i ] = true;
    }
  }

  for ( let i = 0; i < LENGTH; i++ ) {
    if ( incorrect[ i ] ) {
      const correctLetter = correctSolution[ i ];
      for ( let k = 0; k < LENGTH; k++ ) {
        if ( unused[ k ] && correctLetter === attempt[ k ] ) {
          result[ k ] = PRESENT;
          unused[ k ] = false;
          break;
        }
      }
    }
  }

  return result[ 0 ] + 3 * result[ 1 ] + 9 * result[ 2 ] + 27 * result[ 3 ] + 81 * result[ 4 ];
};
const partitionCheckArray = new Array( 3 * 3 * 3 * 3 * 3 );
const fastDoesFullyPartition = ( words, guess ) => {
  partitionCheckArray.fill( false );
  for ( let i = 0; i < words.length; i++ ) {
    const word = words[ i ];
    const match = fastScore( word, guess );
    if ( partitionCheckArray[ match ] ) {
      return false;
    }
    partitionCheckArray[ match ] = true;
  }
  return true;
};
const fastPartition = ( words, guess ) => {
  const map = {};
  for ( let i = 0; i < words.length; i++ ) {
    const word = words[ i ];
    const match = fastScore( word, guess );
    let list = map[ match ];
    if ( !list ) {
      list = map[ match ] = [];
    }
    list.push( word );
  }
  return map;
};
const fastDecode = n => {
  const a = Math.floor( n / 1 ) % 3;
  const b = Math.floor( n / 3 ) % 3;
  const c = Math.floor( n / 9 ) % 3;
  const d = Math.floor( n / 27 ) % 3;
  const e = Math.floor( n / 81 ) % 3;
  return a + b + c + d + e;
};

export { score, perfectScore, encode, decode, IS_HARD_MODE, LENGTH, ABSENT, PRESENT, CORRECT, fastScore, fastDoesFullyPartition, fastPartition, fastDecode, isHardModeValid };
