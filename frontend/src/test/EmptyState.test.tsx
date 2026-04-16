import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../components/EmptyState';

describe('EmptyState', () => {
  it('renders with default props', () => {
    render(<EmptyState />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first entry.')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(<EmptyState title="No tasks" description="Create your first task to get started." />);
    expect(screen.getByText('No tasks')).toBeInTheDocument();
    expect(screen.getByText('Create your first task to get started.')).toBeInTheDocument();
  });

  it('renders action button when actionText and onAction provided', () => {
    const onAction = vi.fn();
    render(<EmptyState actionText="Add Task" onAction={onAction} />);
    const button = screen.getByText('Add Task');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when only actionText is provided', () => {
    render(<EmptyState actionText="Add Task" />);
    expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
  });
});
