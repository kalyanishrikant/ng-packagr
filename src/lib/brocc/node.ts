let NODE_COUNT = 0;

/**
 * A Node in the {@link BuildGraph}.
 */
export class Node {
  private readonly count: number;

  constructor(public readonly url: string) {
    this.count = NODE_COUNT++;
  }

  public get dependents(): Node[] {
    return this._dependents;
  }

  private _dependents: Node[] = [];
  private _dependees: Node[] = [];

  public type: string;

  public data: any;

  public addDependent(dependent: Node | Node[]) {
    const newDeps = dependent instanceof Array ? dependent : [dependent];

    newDeps.forEach(dep => {
      dep._dependees = dep._dependees.filter(d => d !== this).concat(this);
    });

    this._dependents = this._dependents
      .filter(existing => {
        return newDeps.some(newDep => newDep !== existing);
      })
      .concat(newDeps);
  }
}
