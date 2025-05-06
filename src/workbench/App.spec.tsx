import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App component', () => {
    it('renders hello vite heading', () => {
        render(<App />);
        const headingElement = screen.getByText('Hello Vite');
        expect(headingElement).toBeInTheDocument();
    });
});
