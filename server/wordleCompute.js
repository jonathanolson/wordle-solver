
import guessWords from './guessWords.js';
import { perfectScore } from './wordleCore.js';
import partition from './partition.js';

class ComputationNode {
  constructor( words, guesses, skip = false, averageWeight = 2, bestWeight = 1 ) {
    this.words = words; // {string[]}
    this.guesses = guesses; // {string[]}

    this.guessSet = new Set();
    this.guessNodes = []; // {GuessNode[]}
    this.depth = Number.POSITIVE_INFINITY;

    if ( !skip ) {
      this.openNext( averageWeight, bestWeight );
    }
  }

  // @public
  merge( computationNode ) {
    computationNode.guessNodes.forEach( guessNode => {
      if ( this.guessSet.has( guessNode.guess ) ) {
        this.guessNodes.filter( g => g.guess === guessNode.guess )[ 0 ].merge( guessNode );
      }
      else {
        this.guessNodes.push( guessNode );
        this.guessSet.add( guessNode.guess );
      }
    } );
    this.depth = Math.min( ...this.guessNodes.map( guessNode => guessNode.depth ) );
  }

  // @public
  serialize() {
    return {
      w: this.words,
      g: this.guesses,
      d: this.depth,
      n: this.guessNodes.map( guessNode => guessNode.serialize() )
    };
  }

  // @public
  static deserialize( obj ) {
    const node = new ComputationNode( obj.w, obj.g, true );
    node.depth = obj.d;
    node.guessNodes = obj.n.map( o => GuessNode.deserialize( o ) );
    for ( let i = 0; i < node.guessNodes.length; i++ ) {
      node.guessSet.add( node.guessNodes[ i ].guess );
    }
    return node;
  }

  // @public
  createTree( metric = Ranking.minimizeLongestMetric ) {
    let subtree = this.guessNodes[ 0 ].createTree();
    for ( let i = 1; i < this.guessNodes.length; i++ ) {
      const possibleSubtree = this.guessNodes[ i ].createTree();
      if ( metric( possibleSubtree.ranking, subtree.ranking ) < 0 ) {
        subtree = possibleSubtree;
      }
    }
    return subtree;
  }

  // @public
  widen( averageWeight = 2, bestWeight = 1 ) {
    if ( this.depth > 1 ) {
      if ( this.depth > 1 && Math.random() < 0.1 ) {
        this.openNext( averageWeight, bestWeight );
      }
      else {
        const guessNode = this.guessNodes[ Math.floor( Math.random() * this.guessNodes.length ) ];
        guessNode.widen();

        this.depth = Math.min( this.depth, guessNode.depth );
      }
    }
  }

  // @public
  depthOpen( averageWeight = 2, bestWeight = 1 ) {
    if ( this.depth >= 1 ) {
      this.openNext( averageWeight, bestWeight );
    }
    for ( let i = 0; i < this.guessNodes.length; i++ ) {
      const guessNode = this.guessNodes[ i ];
      guessNode.depthOpen();
      this.depth = Math.min( this.depth, guessNode.depth );
    }
  }

  // @public
  depthFix( averageWeight = 2, bestWeight = 1 ) {
    if ( this.depth === 1 ) {
      let hasGoodGuess = false;
      for ( let i = 0; i < this.guessNodes.length; i++ ) {
        if ( this.words.includes( this.guessNodes[ i ].guess ) ) {
          hasGoodGuess = true;
          break;
        }
      }
      if ( !hasGoodGuess ) {
        this.openNext( averageWeight, bestWeight );
      }
    }
    for ( let i = 0; i < this.guessNodes.length; i++ ) {
      const guessNode = this.guessNodes[ i ];
      guessNode.depthFix();
      this.depth = Math.min( this.depth, guessNode.depth );
    }
  }

  // @public
  openUp( level ) {
    if ( this.depth < level || level < 2 ) {
      return;
    }

    this.openNext();

    this.guessNodes.forEach( ( guessNode, i ) => {
      if ( level === 4 ) {
        console.log( `${i} of ${this.guessNodes.length}: ${guessNode.guess}` );
      }
      for ( const score in guessNode.map ) {
        const item = guessNode.map[ score ];
        if ( typeof item !== 'string' ) {
          item.openUp( level - 1 );
        }
      }
      guessNode.recomputeDepth();
      this.depth = Math.min( this.depth, guessNode.depth );
    } );
  }

  // @public
  targetedOpenTo( level, branches = { 3: 100, 2: 6 }, maxDepth = 7, averageWeight = 2, bestWeight = 1 ) {
    if ( this.depth !== level || level < 2 ) {
      return;
    }

    if ( this.guessNodes.length < branches[ level ] ) {
      this.openNext( averageWeight, bestWeight );
    }

    const guessNodes = this.guessNodes;

    guessNodes.forEach( ( guessNode, i ) => {
      guessNode.targetedOpenTo( level, branches, maxDepth, averageWeight, bestWeight );
      this.depth = Math.min( this.depth, guessNode.depth );
    } );
  }

  // @public
  fullRecomputeDepth() {
    this.depth = Math.min( ...this.guessNodes.map( guessNode => {
      guessNode.fullRecomputeDepth();
      return guessNode.depth;
    } ) );
  }

  // @public @deprecated
  getOptions() {
    const options = [];

    for ( let i = 0; i < guessWords.length; i++ ) {
      const guess = guessWords[ i ];
      const map = partition( this.words, guess );
      let size = 0;
      let count = 0;
      let best = 0;
      for ( const score in map ) {
        const length = map[ score ].length;
        best = Math.max( best, length );
        count += 1;
        size += length;
      }
      size = size / ( count * 0.5 ) + best; // average length weighted in as a third
      if ( this.words.includes( guess ) ) {
        // Prefer guesses that are words
        size -= 0.001;
      }
      options.push( new GuessOption( guess, map, size ) );
    }

    // Ordered so we can pop
    options.sort( GuessOption.compare );

    return options;
  }

  // @public
  getNextOption( averageWeight = 2, bestWeight = 1 ) {
    let bestOption = null;

    for ( let i = 0; i < guessWords.length; i++ ) {
      const guess = guessWords[ i ];
      if ( this.guessSet.has( guess ) ) {
        continue;
      }

      const map = partition( this.words, guess );
      let size = 0;
      let count = 0;
      let best = 0;
      for ( const score in map ) {
        const length = map[ score ].length;
        best = Math.max( best, length );
        count += 1;
        size += length;
      }
      size = averageWeight * size / ( count ) + bestWeight * best; // average length weighted in as a third
      if ( this.words.includes( guess ) ) {
        // Prefer guesses that are words
        size -= 0.001;
      }

      if ( !bestOption || size < bestOption.size ) {
        bestOption = new GuessOption( guess, map, size );
      }
    }

    return bestOption;
  }

  // @private
  openNext( averageWeight = 2, bestWeight = 1 ) {
    // if ( this.depth !== 1 ) {
      const option = this.getNextOption( averageWeight, bestWeight );
      if ( option ) {
        const guesses = [ ...this.guesses, option.guess ];

        const guessNode = new GuessNode( option, guesses, false, averageWeight, bestWeight );
        this.guessNodes.push( guessNode );
        this.guessSet.add( option.guess );

        this.depth = Math.min( this.depth, guessNode.depth );
      }
    // }
  }
}
class GuessOption {
  constructor( guess, map, size ) {
    this.guess = guess;
    this.map = map;
    this.size = size;
  }

  // @public
  static compare( a, b ) {
    return a.size > b.size ? 1 : ( a.size < b.size ? -1 : 0 );
  }
}
class GuessNode {
  constructor( option, guesses, skip = false, averageWeight = 2, bestWeight = 1 ) {
    this.guess = option.guess;
    this.depth = 0; // wll be computed

    const map = {};

    if ( !skip ) {
      for ( const score in option.map ) {
        const words = option.map[ score ];
        if ( words.length === 1 ) {
          map[ score ] = words[ 0 ];
        }
        else {
          const node = new ComputationNode( option.map[ score ], guesses, false, averageWeight, bestWeight );
          map[ score ] = node;
        }
      }
    }

    this.map = map;

    this.recomputeDepth();
  }

  // @public
  merge( guessNode ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.merge( guessNode.map[ score ] );
      }
    }
    this.recomputeDepth();
    return this;
  }

  get computationNodes() {
    return Object.values( this.map ).filter( n => typeof n !== 'string' );
  }

  // @public
  computationNodeCount( depth ) {
    return this.computationNodes.filter( n => n.depth === depth ).length;
  }

  // @public
  depthOpen( averageWeight = 2, bestWeight = 1 ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.depthOpen( averageWeight, bestWeight );
      }
    }
    this.recomputeDepth();
  }

  // @public
  depthFix( averageWeight = 2, bestWeight = 1 ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.depthFix( averageWeight, bestWeight );
      }
    }
    this.recomputeDepth();
  }

  // @public
  targetedOpenTo( level, branches, maxDepth, averageWeight, bestWeight ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.targetedOpenTo( level - 1, branches, maxDepth, averageWeight, bestWeight );
      }
    }
    this.recomputeDepth();
  }

  // @public
  recomputeDepth() {
    let depth = 0;

    for ( const score in this.map ) {
      const stringOrComputationNode = this.map[ score ];
      if ( typeof stringOrComputationNode === 'string' ) {
        depth = Math.max( depth, 1 );
      }
      else {
        depth = Math.max( depth, 1 + stringOrComputationNode.depth );
      }
    }

    this.depth = depth;
  }

  // @public
  fullRecomputeDepth() {
    for ( const score in this.map ) {
      const stringOrComputationNode = this.map[ score ];
      if ( typeof stringOrComputationNode !== 'string' ) {
        stringOrComputationNode.fullRecomputeDepth();
      }
    }
    this.recomputeDepth();
  }

  // @public
  serialize() {
    const m = {};
    for ( const score in this.map ) {
      const nodeOrString = this.map[ score ];
      m[ score ] = typeof nodeOrString === 'string' ? nodeOrString : nodeOrString.serialize();
    }
    return {
      g: this.guess,
      d: this.depth,
      m: m
    };
  }

  // @public
  static deserialize( obj ) {
    const guessNode = new GuessNode( { guess: obj.g }, [], true );
    guessNode.depth = obj.d;

    const map = {};
    for ( const score in obj.m ) {
      const item = obj.m[ score ];

      map[ score ] = typeof item === 'string' ? item : ComputationNode.deserialize( item );
    }
    guessNode.map = map;
    return guessNode;
  }

  // @public
  createTree( metric = Ranking.minimizeLongestMetric ) {
    const map = {};
    const ranking = new Ranking();

    for ( const score in this.map ) {
      const stringOrComputationNode = this.map[ score ];
      const isString = typeof stringOrComputationNode === 'string';
      const subtree = isString ? stringOrComputationNode : stringOrComputationNode.createTree( metric );
      map[ score ] = subtree;
      if ( score === perfectScore ) {
        ranking.addSelf();
      }
      else if ( isString ) {
        ranking.addString();
      }
      else {
        ranking.addRanking( subtree.ranking );
      }
    }

    return {
      guess: this.guess,
      map: map,
      depth: this.depth,
      ranking: ranking
    };
  }

  // @public
  widen() {
    let worstDepth = 0;
    for ( const score in this.map ) {
      const node = this.map[ score ];
      if ( typeof node !== 'string' ) {
        worstDepth = Math.max( worstDepth, node.depth );
      }
    }

    const values = Object.values( this.map ).filter( node => node.depth === worstDepth );
    // TODO: better optimized
    const node = values[ Math.floor( Math.random() * values.length ) ];
    node.widen();

    this.recomputeDepth();
  }
}
class Ranking {
  constructor( counts = [ 0, 0 ] ) {
    this.counts = counts;
  }

  // @public
  addString() {
    this.counts[ 1 ]++;
  }

  // @public
  addSelf() {
    this.counts[ 0 ]++;
  }

  // @public -- child ranking
  addRanking( ranking ) {
    for ( let i = 0; i < ranking.counts.length; i++ ) {
      if ( i + 1 >= this.counts.length ) {
        this.counts.push( 0 );
      }
      this.counts[ i + 1 ] += ranking.counts[ i ];
    }
  }

  // @public
  totalGuessesScore() {
    let count = 0;
    for ( let i = 0; i < this.counts.length; i++ ) {
      count += this.counts[ i ] * ( i + 1 );
    }
    return count;
  }

  // @public
  static minimizeLongestMetric( a, b ) {
    if ( a.counts.length < b.counts.length ) {
      return -1;
    }
    if ( a.counts.length > b.counts.length ) {
      return 1;
    }
    for ( let i = a.counts.length - 1; i >= 0; i-- ) {
      if ( a.counts[ i ] < b.counts[ i ] ) {
        return -1;
      }
      if ( a.counts[ i ] > b.counts[ i ] ) {
        return 1;
      }
    }
    return 0;
  }

  // @public
  static totalGuessesMetric( a, b ) {
    const aScore = a.totalGuessesScore();
    const bScore = b.totalGuessesScore();
    return aScore < bScore ? -1 : ( aScore > bScore ? 1 : Ranking.minimizeLongestMetric( a, b ) );
  }
}
const treeStatistics = tree => {
  const counts = {};

  const recurse = ( node, length ) => {
    if ( typeof node === 'string' ) {
      if ( length in counts ) {
        counts[ length ]++;
      }
      else {
        counts[ length ] = 1;
      }
    }
    else {
      for ( const score in node.map ) {
        recurse( node.map[ score ], length + 1 );
      }
    }
  };
  recurse( tree, 1 );
  return counts;
};

export { ComputationNode, GuessNode, GuessOption, treeStatistics, Ranking };
