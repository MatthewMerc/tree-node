import { Injectable } from '@angular/core';
import { delay, Observable, of, tap } from 'rxjs';
import { DynamicFlatNode } from './app.component';

/**
 * Database for dynamic data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the database.
 */
 @Injectable({providedIn: 'root'})
 export class DynamicDatabase {
   dataMap = new Map<string, string[]>([
     ['Fruits', ['Apple', 'Orange', 'Banana']],
     ['Vegetables', ['Tomato', 'Potato', 'Onion']],
     ['Apple', ['Fuji', 'Macintosh']],
     ['Onion', ['Yellow', 'White', 'Purple']],
   ]);

   rootLevelNodes: string[] = ['Fruits', 'Vegetables'];

   /** Initial data from database */
   initialData(): DynamicFlatNode[] {
     return this.rootLevelNodes.map(name => new DynamicFlatNode(name, 0, true));
   }


   getChildren(node: string) {
     return this.dataMap.get(node);
   }

   fetchChildren$(node: string): Observable<string[]> {
     const test = Math.random() < .5  ?['leaf'] : [Math.random().toString()];
     return of(test).pipe(delay(1000),tap(res => {this.dataMap.set(node,res)}))
   }

   isExpandable(node: string): boolean {
     return node !== 'leaf';
   }


 }
