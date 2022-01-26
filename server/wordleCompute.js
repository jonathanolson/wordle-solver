
import guessWords from './guessWords.js';
import { IS_HARD_MODE, isHardModeValid, perfectScore, score } from './wordleCore.js';
import partition from './partition.js';

class ComputationNode {
  constructor( words, guesses, possibleGuesses, skip = false, heuristic = new Heuristic() ) {
    this.words = words; // {string[]}
    this.guesses = guesses; // {string[]}
    this.possibleGuesses = possibleGuesses; // {string[]}

    this.guessSet = new Set();
    this.guessNodes = []; // {GuessNode[]}
    this.depth = Number.POSITIVE_INFINITY;

    if ( !skip ) {
      this.openNext( heuristic );
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
  static deserialize( obj, possibleGuesses = guessWords ) {
    const node = new ComputationNode( obj.w, obj.g, possibleGuesses, true );
    node.depth = obj.d;
    node.guessNodes = obj.n.map( o => GuessNode.deserialize( o, possibleGuesses ) );
    for ( let i = 0; i < node.guessNodes.length; i++ ) {
      node.guessSet.add( node.guessNodes[ i ].guess );
    }
    return node;
  }

  // @public
  createTree( metric = Ranking.minimizeLongestMetric ) {
    let subtree = this.guessNodes[ 0 ].createTree( metric );
    // let solvesInSix = subtree.ranking.counts.length - this.guess.length <= 6;
    for ( let i = 1; i < this.guessNodes.length; i++ ) {
      const possibleSubtree = this.guessNodes[ i ].createTree( metric );
      // const subSolvesInSix = possibleSubtree.ranking.counts.length - this.guess.length <= 6;
      if ( metric( possibleSubtree.ranking, subtree.ranking ) < 0 ) {
        subtree = possibleSubtree;
      }
    }
    return subtree;
  }

  // @public - returns tree or null
  createLimitedTree( guessesLeft = 6 ) {
    let subtree = this.guessNodes[ 0 ].createLimitedTree( guessesLeft );
    for ( let i = 1; i < this.guessNodes.length; i++ ) {
      const possibleSubtree = this.guessNodes[ i ].createLimitedTree( guessesLeft );
      if ( !subtree || ( possibleSubtree && Ranking.totalGuessesMetric( possibleSubtree.ranking, subtree.ranking ) < 0 ) ) {
        subtree = possibleSubtree;
      }
    }
    return subtree;
  }

  // @public
  widen( heuristic ) {
    if ( this.depth > 1 ) {
      if ( this.depth > 1 && Math.random() < 0.1 ) {
        this.openNext( heuristic );
      }
      else {
        const guessNode = this.guessNodes[ Math.floor( Math.random() * this.guessNodes.length ) ];
        guessNode.widen();

        this.depth = Math.min( this.depth, guessNode.depth );
      }
    }
  }

  // @public
  depthOpen( heuristic ) {
    if ( this.depth >= 1 ) {
      this.openNext( heuristic );
    }
    for ( let i = 0; i < this.guessNodes.length; i++ ) {
      const guessNode = this.guessNodes[ i ];
      guessNode.depthOpen( heuristic );
      this.depth = Math.min( this.depth, guessNode.depth );
    }
  }

  // @public
  depthFix( heuristic ) {
    if ( this.depth === 1 ) {
      let hasGoodGuess = false;
      for ( let i = 0; i < this.guessNodes.length; i++ ) {
        if ( this.words.includes( this.guessNodes[ i ].guess ) ) {
          hasGoodGuess = true;
          break;
        }
      }
      if ( !hasGoodGuess ) {
        this.openNext( heuristic );
      }
    }
    for ( let i = 0; i < this.guessNodes.length; i++ ) {
      const guessNode = this.guessNodes[ i ];
      guessNode.depthFix();
      this.depth = Math.min( this.depth, guessNode.depth );
    }
  }

  // @public
  openUp( level, heuristic ) {
    if ( this.depth < level || level < 2 ) {
      return;
    }

    this.openNext( heuristic );

    this.guessNodes.forEach( ( guessNode, i ) => {
      if ( level === 4 ) {
        console.log( `${i} of ${this.guessNodes.length}: ${guessNode.guess}` );
      }
      for ( const score in guessNode.map ) {
        const item = guessNode.map[ score ];
        if ( typeof item !== 'string' ) {
          item.openUp( level - 1, heuristic );
        }
      }
      guessNode.recomputeDepth();
      this.depth = Math.min( this.depth, guessNode.depth );
    } );
  }

  // @public
  targetedOpenTo( level, branches = { 3: 100, 2: 6 }, maxDepth = 7, heuristic ) {
    if ( this.depth !== level || level < 2 ) {
      return;
    }

    if ( this.guessNodes.length < branches[ level ] ) {
      this.openNext( heuristic );
    }

    const guessNodes = this.guessNodes;

    guessNodes.forEach( ( guessNode, i ) => {
      guessNode.targetedOpenTo( level, branches, maxDepth, heuristic );
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

  // @public
  getOptions( heuristic ) {
    const options = [];

    for ( let i = 0; i < this.possibleGuesses.length; i++ ) {
      const guess = this.possibleGuesses[ i ];
      if ( this.guessSet.has( guess ) ) {
        continue;
      }

      const map = partition( this.words, guess );
      const heuristicScore = Heuristic.score( this.words, guess, map, heuristic, this.depth <= 3 );

      options.push( new GuessOption( guess, map, heuristicScore ) );
    }

    // Ordered so we can pop
    options.sort( GuessOption.compare );

    return options;
  }

  // @public
  getNextOption( heuristic ) {
    let bestOption = null;

    for ( let i = 0; i < this.possibleGuesses.length; i++ ) {
      const guess = this.possibleGuesses[ i ];
      if ( this.guessSet.has( guess ) ) {
        continue;
      }

      const map = partition( this.words, guess );
      const heuristicScore = Heuristic.score( this.words, guess, map, heuristic, this.depth <= 2 );

      if ( !bestOption || heuristicScore < bestOption.size ) {
        bestOption = new GuessOption( guess, map, heuristicScore );
      }
    }

    return bestOption;
  }

  // @public
  openSpecificGuess( guess, heuristic ) {
    if ( this.guessSet.has( guess ) ) {
      return;
    }

    const option = new GuessOption( guess, partition( this.words, guess ), 1 );

    this.openOption( option, heuristic );
  }

  // @private
  openNext( heuristic ) {
    // if ( this.depth !== 1 ) {
      const option = this.getNextOption( heuristic );
      if ( option ) {
        this.openOption( option, heuristic );
      }
    // }
  }

  // @private
  openOption( option, heuristic ) {
    const guesses = [ ...this.guesses, option.guess ];

    const guessNode = new GuessNode( option, guesses, this.possibleGuesses, false, heuristic );
    this.guessNodes.push( guessNode );
    this.guessSet.add( option.guess );

    this.depth = Math.min( this.depth, guessNode.depth );
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
  constructor( option, guesses, possibleGuesses, skip = false, heuristic = new Heuristic() ) {
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
          const newPossibleGuesses = IS_HARD_MODE ? possibleGuesses.filter( guess => isHardModeValid( guess, option.guess, score ) ) : guessWords;
          const node = new ComputationNode( option.map[ score ], guesses, newPossibleGuesses, false, heuristic );
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
  depthOpen( heuristic ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.depthOpen( heuristic );
      }
    }
    this.recomputeDepth();
  }

  // @public
  depthFix( heuristic ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.depthFix( heuristic );
      }
    }
    this.recomputeDepth();
  }

  // @public
  targetedOpenTo( level, branches, maxDepth, heuristic ) {
    for ( const score in this.map ) {
      const item = this.map[ score ];
      if ( typeof item !== 'string' ) {
        item.targetedOpenTo( level - 1, branches, maxDepth, heuristic );
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
  openGuesses( guesses, heuristic ) {
    if ( guesses[ 0 ] === this.guess && guesses.length > 1 ) {
      const nextGuess = guesses[ 1 ];
      const next = this.map[ score( guesses[ guesses.length - 1 ], this.guess ) ];
      if ( typeof next !== 'string' && next ) {
        next.openSpecificGuess( nextGuess, heuristic );
        const guessNode = next.guessNodes.filter( guessNode => guessNode.guess === nextGuess )[ 0 ];
        guessNode.openGuesses( guesses.slice( 1 ), heuristic );
      }
    }
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
  static deserialize( obj, possibleGuesses = guessWords ) {
    const guessNode = new GuessNode( { guess: obj.g }, [], [], true, new Heuristic() );
    guessNode.depth = obj.d;

    const map = {};
    for ( const score in obj.m ) {
      const item = obj.m[ score ];

      map[ score ] = typeof item === 'string' ? item : ComputationNode.deserialize( item, possibleGuesses.filter( guess => isHardModeValid( guess, obj.g, score ) ) );
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
  createLimitedTree( guessesLeft = 6 ) {
    const map = {};
    const ranking = new Ranking();

    for ( const score in this.map ) {
      const isPerfect = score === perfectScore;
      if ( guessesLeft === 1 && !isPerfect ) {
        return null;
      }

      const stringOrComputationNode = this.map[ score ];
      const isString = typeof stringOrComputationNode === 'string';
      const subtree = isString ? stringOrComputationNode : stringOrComputationNode.createLimitedTree( guessesLeft - 1 );
      if ( !subtree ) {
        return null;
      }
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

class Heuristic {
  constructor( averageWeight = 100, bestWeight = 1, nextWeight = 0 ) {
    this.averageWeight = averageWeight;
    this.bestWeight = bestWeight;
    this.nextWeight = nextWeight;
  }

  // @public
  static score( words, guess, map, heuristic, skipNext ) {
    const averageWeight = heuristic.averageWeight;
    const bestWeight = heuristic.bestWeight;
    const nextWeight = heuristic.nextWeight;

    let count = 0;
    let best = 0;
    let bestScore = '22222';
    for ( const score in map ) {
      const length = map[ score ].length;
      if ( best < length ) {
        best = length;
        bestScore = score;
      }
      best = Math.max( best, length );
      count += 1;
    }
    let size = averageWeight * words.length / ( count ) + bestWeight * best; // average length weighted in as a third
    if ( !skipNext && nextWeight && map[ bestScore ].length > 1 ) {
      const subWords = map[ bestScore ];
      let minSub = Number.POSITIVE_INFINITY;
      for ( let i = 0; i < guessWords.length; i++ ) {
        const guessWord = guessWords[ i ];
        const subPart = partition( subWords, guessWord );
        minSub = Math.min( minSub, Heuristic.score( subWords, guessWord, subPart, heuristic, true ) );
      }
      size += minSub * nextWeight;
    }
    if ( words.includes( guess ) ) {
      // Prefer guesses that are words
      size -= 0.001;
    }
    return size;
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

export { ComputationNode, GuessNode, GuessOption, treeStatistics, Ranking, Heuristic };
