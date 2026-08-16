import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home page without crashing', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Amplify Your Reach with LocalAds/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
});

import Statistics from './Components/Dashboard/statistics';

const sampleAdsData = [{
  id: 1,
  title: 'Demo Ad',
  total_views: 120,
  unique_views: 30,
  total_clicks: 40,
  unique_clicks: 10,
  regions: {
    '101': { views: 60, clicks: 25 }
  },
  apps: {
    'app-1': { views: 80, clicks: 30 }
  },
  datetimes: {
    2025: {
      8: {
        week1: {
          1: { day: 'fri', views: 50, clicks: 15 }
        }
      }
    }
  }
}];

test('shows dashboard charts when stats data is available', () => {
  render(<Statistics adsData={sampleAdsData} />);
  expect(screen.getByText(/Views vs Clicks/i)).toBeInTheDocument();
  expect(screen.getByText(/Daily Trend/i)).toBeInTheDocument();
});
