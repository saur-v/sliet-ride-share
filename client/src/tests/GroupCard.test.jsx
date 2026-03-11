// client/src/tests/GroupCard.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GroupCard from '../components/GroupCard.jsx';

const makeGroup = (overrides = {}) => ({
  _id:         'group123',
  title:       'Sangrur 9pm - 4 seats',
  origin:      'SLIET Main Gate',
  destination: 'Sangrur Bus Stand',
  date:        new Date(Date.now() + 86400000).toISOString(), // tomorrow
  time:        '21:00',
  seatsTotal:  4,
  seatsTaken:  2,
  status:      'open',
  seatPrice:   0,
  ...overrides,
});

const renderCard = (group) =>
  render(
    <MemoryRouter>
      <GroupCard group={group} />
    </MemoryRouter>
  );

describe('GroupCard', () => {
  it('renders title', () => {
    renderCard(makeGroup());
    expect(screen.getByText('Sangrur 9pm - 4 seats')).toBeInTheDocument();
  });

  it('shows origin → destination', () => {
    renderCard(makeGroup());
    expect(screen.getByText(/SLIET Main Gate/)).toBeInTheDocument();
    expect(screen.getByText(/Sangrur Bus Stand/)).toBeInTheDocument();
  });

  it('shows correct seats remaining', () => {
    renderCard(makeGroup({ seatsTotal: 4, seatsTaken: 2 }));
    expect(screen.getByText(/2 seats? left/i)).toBeInTheDocument();
  });

  it('shows 0 seats left in red when full', () => {
    renderCard(makeGroup({ seatsTotal: 4, seatsTaken: 4 }));
    const el = screen.getByText(/0 seats? left/i);
    expect(el).toHaveClass('text-red-500');
  });

  it('shows status badge', () => {
    renderCard(makeGroup({ status: 'confirmed' }));
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  it('shows seat price when > 0', () => {
    renderCard(makeGroup({ seatPrice: 50 }));
    expect(screen.getByText(/₹50/)).toBeInTheDocument();
  });

  it('links to group details page', () => {
    renderCard(makeGroup({ _id: 'abc123' }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/groups/abc123');
  });
});
