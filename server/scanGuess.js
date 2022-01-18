
import guessWords from './guessWords.js';
import targetWords from './targetWords.js';
import { fastDoesFullyPartition, fastPartition } from './wordleCore.js';

// node --max-old-space-size=8192 server/scanGuess.js

const scanGuess = firstGuess => {
  const parts = fastPartition( targetWords, firstGuess );

  for ( const part in parts ) {
    let firstPartSolved = false;
    const secondWords = parts[ part ];

    // For things not immediately determined by the second guess
    if ( secondWords.length > 1 ) {
      process.stdout.write( '  ' + part + ' ' );

      let letter = '';
      for ( let i = 0; i < guessWords.length; i++ ) {
        let secondPartFailed = false;
        const secondGuess = guessWords[ i ];
        if ( letter !== secondGuess[ 0 ] ) {
          letter = secondGuess[ 0 ];
          process.stdout.write( letter );
        }

        const secondParts = fastPartition( secondWords, secondGuess );

        for ( const secondPart in secondParts ) {
          let thirdGuessSolved = false;
          const thirdWords = secondParts[ secondPart ];

          // For things not immediately determined by the third guess
          if ( thirdWords.length > 1 ) {
            for ( let k = 0; k < guessWords.length; k++ ) {
              const thirdGuess = guessWords[ i ];

              if ( fastDoesFullyPartition( thirdWords, thirdGuess ) ) {
                thirdGuessSolved = true;
                break;
              }
            }

            if ( !thirdGuessSolved ) {
              secondPartFailed = true;
              break;
            }
          }
        }

        if ( !secondPartFailed ) {
          firstPartSolved = true;
          break;
        }
      }

      process.stdout.write( '\n' );

      if ( !firstPartSolved ) {
        return false;
      }
    }
  }

  return true;
};

export default scanGuess;
