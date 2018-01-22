import { InjectionToken, Provider, ReflectiveInjector, ValueProvider } from 'injection-js';
import { of as observableOf } from 'rxjs/observable/of';
import { take, map } from 'rxjs/operators';
import { BuildGraph } from '../brocc/build-graph';
import { Node } from '../brocc/node';
import { TsConfig, DEFAULT_TS_CONFIG_PROVIDER, DEFAULT_TS_CONFIG_TOKEN } from '../ts/default-tsconfig';
import { INIT_TS_CONFIG_PROVIDER } from '../ts/init-tsconfig';
import { ENTRY_POINT_TRANSFORM } from './entry-point.di';
import { PACKAGE_TRANSFORM } from './package.di';
import { provideProject } from './project.di';

export class NgPackagr {
  constructor(private providers: Provider[]) {}

  public withProviders(providers: Provider[]): NgPackagr {
    this.providers = [...this.providers, ...providers];

    return this;
  }

  /** Overwrites the default TypeScript configuration. */
  public withTsConfig(defaultValues: TsConfig): NgPackagr {
    this.providers.push({
      provide: DEFAULT_TS_CONFIG_TOKEN,
      useValue: defaultValues
    });

    return this;
  }

  public forProject(project: string): NgPackagr {
    this.providers.push(provideProject(project));

    return this;
  }

  public build(): Promise<void> {
    const injector = ReflectiveInjector.resolveAndCreate(this.providers);

    // TODO
    const transforms = injector.get(PACKAGE_TRANSFORM.provide);

    return observableOf(new BuildGraph())
      .pipe(transforms, take(1), map(() => {}))
      .toPromise();
  }
}

export const ngPackagr = (): NgPackagr =>
  new NgPackagr([
    // Add default providers to this list.
    PACKAGE_TRANSFORM,
    ENTRY_POINT_TRANSFORM,
    DEFAULT_TS_CONFIG_PROVIDER,
    INIT_TS_CONFIG_PROVIDER
  ]);
