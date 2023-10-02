/**
 * Returns all keys of object type T whose value matches type V.
 * Typescript Reference: 
 *  - Mapped Type Modifiers: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers
 *  - Conditional Types: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 *  - Index Access Types: https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
 */
export type ObjectKeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];

 /**
  * Returns all primitive types in JavaScript.
  */
export type Primitive = string | number | bigint | boolean | symbol;
