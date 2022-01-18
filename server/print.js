
import util from 'util';

const print = obj => {
  console.log( util.inspect( obj, {
    showHidden: false,
    depth: null,
    colors: true,
    maxArrayLength: null
  } ) );
};
export default print;