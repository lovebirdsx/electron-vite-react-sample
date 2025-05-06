import { describe, it, expect } from 'vitest';
import { add } from './calc';

describe('add function', () => {
    it('positive numbers', () => {
        expect(add(2, 3)).toBe(5);
    });

    it('negative numbers', () => {
        expect(add(-2, -3)).toBe(-5);
    });    
});
