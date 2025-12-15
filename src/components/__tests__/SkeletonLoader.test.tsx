import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonLoader } from '../SkeletonLoader';

describe('SkeletonLoader Component', () => {
  it('renders card type by default', () => {
    render(<SkeletonLoader />);
    const cards = screen.getAllByText('', { selector: '.prayer-card' });
    expect(cards).toHaveLength(3);
  });

  it('renders specified number of items', () => {
    render(<SkeletonLoader count={5} />);
    const cards = screen.getAllByText('', { selector: '.prayer-card' });
    expect(cards).toHaveLength(5);
  });

  it('renders card type with correct structure', () => {
    render(<SkeletonLoader type="card" count={1} />);
    const card = screen.getByText('', { selector: '.prayer-card' });

    // Check for skeleton elements
    const skeletons = card.querySelectorAll('.skeleton');
    expect(skeletons).toHaveLength(7); // header title, header subtitle, status, 3 content lines, footer, and one more

    // Check for specific classes
    expect(card).toHaveClass('prayer-card');
    expect(card).toHaveClass('bg-white');
  });

  it('renders list type correctly', () => {
    render(<SkeletonLoader type="list" count={2} />);
    const skeletons = screen.getAllByText('', { selector: '.skeleton' });
    expect(skeletons).toHaveLength(2);

    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('h-16');
      expect(skeleton).toHaveClass('w-full');
    });
  });

  it('renders header type correctly', () => {
    render(<SkeletonLoader type="header" />);
    const skeletons = screen.getAllByText('', { selector: '.skeleton' });
    expect(skeletons).toHaveLength(2);

    expect(skeletons[0]).toHaveClass('h-8');
    expect(skeletons[0]).toHaveClass('w-64');
    expect(skeletons[1]).toHaveClass('h-4');
    expect(skeletons[1]).toHaveClass('w-96');
  });

  it('applies correct spacing classes', () => {
    render(<SkeletonLoader type="card" count={2} />);
    const container = screen.getByText('', { selector: '.space-y-4' });
    expect(container).toBeInTheDocument();
  });

  it('renders nothing for invalid type', () => {
    // @ts-expect-error Testing invalid type
    render(<SkeletonLoader type="invalid" />);
    expect(screen.queryByText('', { selector: '.skeleton' })).not.toBeInTheDocument();
  });

  it('card type has minimum height', () => {
    render(<SkeletonLoader type="card" count={1} />);
    const card = screen.getByText('', { selector: '.prayer-card' });
    expect(card).toHaveStyle({ minHeight: '200px' });
  });

  it('card type includes all expected skeleton elements', () => {
    render(<SkeletonLoader type="card" count={1} />);
    const card = screen.getByText('', { selector: '.prayer-card' });

    // Check for header section
    const headerSection = card.querySelector('.flex.items-start');
    expect(headerSection).toBeInTheDocument();

    // Check for content section
    const contentSection = card.querySelector('.space-y-2');
    expect(contentSection).toBeInTheDocument();

    // Check for footer section
    const footerSection = card.querySelector('.border-t');
    expect(footerSection).toBeInTheDocument();
  });
});
