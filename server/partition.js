
import { score } from './wordleCore.js';

const partition = ( words, guess ) => {
  const map = {};
  for ( let i = 0; i < words.length; i++ ) {
    const word = words[ i ];
    const match = score( word, guess );
    let list = map[ match ];
    if ( !list ) {
      list = map[ match ] = [];
    }
    list.push( word );
  }
  return map;
};
export default partition;