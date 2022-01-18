
import { save, load } from './files.js';
import util from 'util';

// node --max-old-space-size=8192 server/loop.js

const root = load();

const print = obj => {
  console.log( util.inspect( obj, {
    showHidden: false,
    depth: null,
    colors: true,
    maxArrayLength: null
  } ) );
};

const status = () => {
  print( root.createTree().ranking.counts );
  print( root.guessNodes.map( guessNode => {
    return {
      guessNode: guessNode.guess,
      count: Object.values( guessNode.map ).filter( n => typeof n !== 'string' && n.depth === 3 ).length,
      ranking: guessNode.createTree().ranking.counts.toString()
    };
  } ) );
};

const loop = () => {
  while ( true ) {
    status();
    console.log( 'starting targeted scan' );
    root.targetedOpenTo( 4, { 4: 0, 3: 100, 2: 6 }, 7 );
    save( root );

    status();
    console.log( 'starting very deep scan' );
    root.targetedOpenTo( 4, { 4: 0, 3: 150, 2: 8 }, 5 );
    save( root );

    status();
    console.log( 'starting wide scan' );
    root.openTo( 4, { 4: 1000, 3: 3, 2: 2 } );
    save( root );

    status();
    console.log( 'opening a few' );
    root.openNext();
    root.openNext();
    root.openNext();
    root.openNext();
    root.openNext();
    save( root );
  }
};
loop();
