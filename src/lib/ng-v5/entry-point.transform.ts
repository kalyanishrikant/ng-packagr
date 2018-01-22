import { InjectionToken, FactoryProvider, ValueProvider } from 'injection-js';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { map, switchMap, tap } from 'rxjs/operators';
import { BuildGraph } from '../brocc/build-graph';
import { Node } from '../brocc/node';
import { Transform } from '../brocc/transform';
import * as log from '../util/log';

export const entryPointTransform = () => (source$: Observable<BuildGraph>): Observable<BuildGraph> => {
  // TODO: transformSources() re-written
  // clean
  // prepareTsConfig
  // analyzeTsSources (collectTemplateAndStylesheetFiles)
  // processAssets
  // modifyTsSources (inlineTemplatesAndStyles)
  // compileTs
  // writeBundles
  //  |- bundleToFesm15
  //  |- bundleToFesm5
  //  |- bundleToUmd
  //  |- bundleToUmdMin
  // relocateSourceMaps
  // copyFiles
  //  |- copyBundleFiles
  //  |- copyMetadataJson
  //  |- copySourceMaps
  // writePackageJson

  return source$.pipe(
    //tap(() => log.info(`Building from sources for entry point`)),

    switchMap(graph => {
      const entryPoint = graph
        .filter(node => node.type === 'application/ng-entry-point')
        .find(ep => true /*ep.state === 'dirty'*/);

      console.log('yehaa', entryPoint);

      return observableOf(graph);
    })

    //tap(() => log.info(`Built.`))
  );
};
