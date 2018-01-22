import { Observable } from 'rxjs/Observable';
import { concat as concatStatic } from 'rxjs/observable/concat';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of as observableOf } from 'rxjs/observable/of';
import { map, retry, switchMap, takeLast, tap } from 'rxjs/operators';
import { pipe as pipeUtil } from 'rxjs/util/pipe';
import { BuildGraph } from '../brocc/build-graph';
import { Node } from '../brocc/node';
import { Transform } from '../brocc/transform';
import { discoverPackages } from '../steps/init';
import * as log from '../util/log';
import { copyFiles } from '../util/copy';
import { rimraf } from '../util/rimraf';

export const packageTransformFactory = (project: string, entryPointTransform: Transform) => (
  source$: Observable<BuildGraph>
): Observable<BuildGraph> => {
  const pkgUri = `ng://${project}`;

  return source$.pipe(
    tap(() => {
      log.info(`Building Angular Package`);
    }),
    // Discover packages and entry points
    switchMap(graph => {
      const pkg = discoverPackages({ project });

      return fromPromise(pkg).pipe(
        map(value => {
          const ngPkg = new Node(pkgUri);
          ngPkg.type = 'application/ng-package';
          ngPkg.data = value;

          return graph.put(ngPkg);
        })
      );
    }),
    // Clean the primary dest folder (should clean all secondary sub-directory, as well)
    switchMap(graph => fromPromise(rimraf(graph.get(pkgUri).data.dest)), (graph, _) => graph),
    // Add entry points to graph
    map(graph => {
      const ngPkg = graph.get(pkgUri);

      const entryPoints = [ngPkg.data.primary, ...ngPkg.data.secondaries].map(entryPoint => {
        const node = new Node(`ng://${entryPoint.moduleId}`);
        node.type = 'application/ng-entry-point';
        node.data = entryPoint;
        node.addDependent(ngPkg);

        return node;
      });

      return graph.put(entryPoints);
    }),
    // Next, run through the entry point transformation
    switchMap(graph => {
      const eachEntryPoint$ = graph
        .filter(node => node.type === 'application/ng-entry-point')
        .map(() => observableOf(graph).pipe(entryPointTransform));

      return concatStatic(...eachEntryPoint$).pipe(takeLast(1));
    }),
    // Write npm package to dest folder
    writeNpmPackage(pkgUri),
    tap(graph => {
      const ngPkg = graph.get(pkgUri);
      log.success(`Built Angular Package!
- from: ${ngPkg.data.src}
- to:   ${ngPkg.data.dest}`);
    })
  );
};

const writeNpmPackage = (pkgUri: string): Transform =>
  pipeUtil(
    switchMap(graph => {
      const ngPkg = graph.get(pkgUri);

      return fromPromise(
        Promise.all([
          copyFiles(`${ngPkg.data.src}/README.md`, ngPkg.data.dest),
          copyFiles(`${ngPkg.data.src}/LICENSE`, ngPkg.data.dest),
          rimraf(ngPkg.data.workingDirectory)
        ])
      ).pipe(map(() => graph));
    })
  );
