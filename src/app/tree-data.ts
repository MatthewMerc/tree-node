import {
  DataSource,
  CollectionViewer,
  SelectionChange,
} from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  BehaviorSubject,
  Observable,
  merge,
  map,
  take,
  tap,
  switchMap,
  mergeAll,
  pipe,
} from 'rxjs';
import { DynamicFlatNode } from './app.component';
import { DynamicDatabase } from './tree-data-source';

export class DynamicDataSource implements DataSource<DynamicFlatNode> {
  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<DynamicFlatNode>,
    private _database: DynamicDatabase
  ) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this._treeControl.expansionModel.changed.subscribe((change) => {
      if (
        (change as SelectionChange<DynamicFlatNode>).added ||
        (change as SelectionChange<DynamicFlatNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(
      map(() => this.data)
    );
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach((node) => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach((node) => this.toggleNode(node, false));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    const children = this._database.getChildren(node.item);
    node.isLoading = true;
    this.updateTree$(
      expand,
      children ?? this._database.fetchChildren$(node.item),
      node
    ).subscribe();
  }

  updateTree$ = (
    expand: boolean,
    children$: Observable<string[]>,
    node: DynamicFlatNode
  ) =>
    children$.pipe(
      take(1),
      tap((children) => {
        const index = this.data.indexOf(node);
        expand
          ? this.expandTreeSection(index, node, children)
          : this.collapseTreeSection(index, node);
        // notify the change
        this.dataChange.next(this.data);
        node.isLoading = false;
      }),
      this.loadChildren()
    );

  loadChildren = () =>
    pipe(
      switchMap((children: string[]) =>
        children
          .filter((child) => child !== 'leaf')
          .map((child) => this._database.fetchChildren$(child))
      ),
      mergeAll()
    );

  private expandTreeSection(
    index: number,
    node: DynamicFlatNode,
    children: string[]
  ) {
    const nodes = children.map(
      (child: string) =>
        new DynamicFlatNode(
          child,
          node.level + 1,
          this._database.isExpandable(child)
        )
    );
    this.data.splice(index + 1, 0, ...nodes);
  }

  private collapseTreeSection(index: number, node: DynamicFlatNode) {
    let hideCount = 0;
    for (
      let i = index + 1;
      i < this.data.length && this.data[i].level > node.level;
      i++
    ) {
      hideCount++;
    }
    this.data.splice(index + 1, hideCount);
  }
}
