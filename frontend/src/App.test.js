import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import Statistics from './Components/Dashboard/statistics';

test('renders the home page without crashing', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Amplify Your Reach with LocalAds/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
});

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
  viewsByLocation: {
    pincode: [{ pincode: '101', views: 4, uniqueViews: 2 }]
  },
  clicksByLocation: {
    pincode: [{ pincode: '101', clicks: 3, uniqueClicks: 2 }]
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

test('switches the region chart to unique views', () => {
  render(<Statistics adsData={sampleAdsData} />);

  fireEvent.click(screen.getByRole('button', { name: 'Views' }));
  fireEvent.click(screen.getByRole('button', { name: 'Unique Views' }));

  expect(screen.getByRole('heading', { name: 'Unique Views by Region' })).toBeInTheDocument();
});

test('shows clicks by region chart', () => {
  render(<Statistics adsData={sampleAdsData} />);

  expect(screen.getByRole('heading', { name: 'Clicks by Region' })).toBeInTheDocument();
});
