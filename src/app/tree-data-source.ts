import { Injectable } from '@angular/core';
import { delay, Observable, of, shareReplay, tap } from 'rxjs';
import { DynamicFlatNode } from './app.component';

/**
 * Database for dynamic data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the database.
 */
 @Injectable({providedIn: 'root'})
 export class DynamicDatabase {
   dataMap = new Map<string, Observable<string[]>>([
     ['Fruits', of(['Apple', 'Orange', 'Banana'])],
     ['Vegetables', of(['Tomato', 'Potato', 'Onion'])],
     ['Apple', of(['Fuji', 'Macintosh'])],
     ['Onion', of(['Yellow', 'White', 'Purple'])],
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
     if(!!this.dataMap.get(node)) {
       return this.dataMap.get(node) as Observable<string[]>;
     }
     const test = [...new Array(3)].map(this.genNode)
     const children$ = of(test).pipe(delay(5000),shareReplay(1));
     this.dataMap.set(node,children$);
     return children$;
   }

   isExpandable(node: string): boolean {
     return node !== 'leaf';
   }
   private i = 0;
   private genNode  = () => Math.random() < .5 ? 'leaf' : (++this.i).toString();


 }
