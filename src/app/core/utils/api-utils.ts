import { map, OperatorFunction } from 'rxjs';

/**
 * Generic interface representing a Spring Data REST response with _embedded structure.
 * @template T The type of entity in the embedded collection
 */
export interface SpringDataResponse<T> {
  _embedded: {
    [key: string]: T[];
  };
  _links?: {
    self?: { href: string };
    profile?: { href: string };
    [key: string]: { href: string } | undefined;
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

/**
 * Generic interface for Spring Data Page responses.
 * @template T The type of entity in the content array
 */
export interface SpringPageResponse<T> {
  content: T[];
  pageable?: {
    pageNumber: number;
    pageSize: number;
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Type guard to check if response is a Spring Data REST embedded response
 */
function isSpringDataResponse<T>(response: unknown): response is SpringDataResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    '_embedded' in response &&
    typeof (response as SpringDataResponse<T>)._embedded === 'object'
  );
}

/**
 * Type guard to check if response is a Spring Page response
 */
function isSpringPageResponse<T>(response: unknown): response is SpringPageResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'content' in response &&
    Array.isArray((response as SpringPageResponse<T>).content)
  );
}

/**
 * Custom RxJS operator that normalizes Spring Data responses.
 * 
 * Handles three response formats:
 * 1. Spring Data REST: { "_embedded": { "entityKey": [...] } }
 * 2. Spring Page: { "content": [...] }
 * 3. Plain array: [...]
 * 
 * @template T The type of entity in the response
 * @param entityKey The key used in _embedded object (e.g., 'products', 'customers')
 * @returns An RxJS operator that transforms the response to T[]
 * 
 * @example
 * // For Spring Data REST response
 * this.http.get<unknown>('/api/products')
 *   .pipe(mapSpringDataResponse<Product>('products'))
 *   .subscribe(products => console.log(products)); // Product[]
 */
export function mapSpringDataResponse<T>(entityKey: string): OperatorFunction<unknown, T[]> {
  return map((response: unknown): T[] => {
    // Handle Spring Data REST _embedded response
    if (isSpringDataResponse<T>(response)) {
      return response._embedded[entityKey] ?? [];
    }
    
    // Handle Spring Page response with content array
    if (isSpringPageResponse<T>(response)) {
      return response.content;
    }
    
    // Handle plain array response
    if (Array.isArray(response)) {
      return response as T[];
    }
    
    // Fallback: return empty array for unexpected formats
    console.warn('[mapSpringDataResponse] Unexpected response format:', response);
    return [];
  });
}
