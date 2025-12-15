import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Checkbox from '../Checkbox';

describe('Checkbox Component', () => {
  it('renders with default props', () => {
    render(<Checkbox />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeInTheDocument();
    expect(input).not.toBeChecked();
  });

  it('renders with checked state', () => {
    render(<Checkbox checked />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
    const box = input.nextElementSibling;
    const svg = box?.querySelector('svg');
    expect(svg).toBeInTheDocument(); // The SVG checkmark
  });

  it('renders unchecked state without checkmark', () => {
    render(<Checkbox checked={false} />);
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
    const box = input.nextElementSibling;
    const svg = box?.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('calls onChange when clicked', () => {
    const mockOnChange = vi.fn();
    render(<Checkbox onChange={mockOnChange} />);
    const input = screen.getByRole('checkbox');
    fireEvent.click(input);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('applies id and name attributes', () => {
    render(<Checkbox id="test-id" name="test-name" />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('id', 'test-id');
    expect(input).toHaveAttribute('name', 'test-name');
  });

  it('handles disabled state', () => {
    render(<Checkbox disabled />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeDisabled();
  });

  it('applies custom wrapperClassName', () => {
    render(<Checkbox wrapperClassName="custom-wrapper" />);
    const label = screen.getByRole('checkbox').closest('label');
    expect(label).toHaveClass('custom-wrapper');
  });

  it('applies custom boxClassName', () => {
    render(<Checkbox boxClassName="custom-box" />);
    const box = screen.getByRole('checkbox').nextElementSibling;
    expect(box).toHaveClass('custom-box');
  });

  it('applies custom checkClassName when checked', () => {
    render(<Checkbox checked checkClassName="custom-check" />);
    const box = screen.getByRole('checkbox').nextElementSibling;
    const svg = box?.querySelector('svg');
    expect(svg).toHaveClass('custom-check');
  });

  it('renders children content', () => {
    render(<Checkbox>Test Label</Checkbox>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not render children when not provided', () => {
    render(<Checkbox />);
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it('passes through additional props to input', () => {
    render(<Checkbox data-testid="custom-prop" />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('data-testid', 'custom-prop');
  });

  it('maintains accessibility with label association', () => {
    render(<Checkbox id="checkbox-id">Label Text</Checkbox>);
    const input = screen.getByRole('checkbox');
    const label = screen.getByText('Label Text');
    expect(input).toHaveAttribute('id', 'checkbox-id');
    expect(label).toBeInTheDocument();
  });
});
