import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SiteAnalyticsActivityChartComponent } from './site-analytics-activity-chart.component';
import { AnalyticsService } from '../../services/analytics.service';

const chartMock = vi.hoisted(() => vi.fn());

vi.mock('chart.js/auto', () => ({
  Chart: class MockChart {
    destroy = vi.fn();
    update = vi.fn();
    constructor(..._args: unknown[]) {
      chartMock(..._args);
    }
  }
}));

describe('SiteAnalyticsActivityChartComponent', () => {
  let getPageViewTimeSeries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    chartMock.mockClear();

    getPageViewTimeSeries = vi.fn().mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => ({
        bucketStart: `2024-01-0${i + 1}T12:00:00.000Z`,
        count: i,
        approvalCount: 0,
        approvalLabels: ''
      }))
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create and load time series', async () => {
    await render(SiteAnalyticsActivityChartComponent, {
      providers: [
        {
          provide: AnalyticsService,
          useValue: { getPageViewTimeSeries }
        }
      ]
    });

    expect(await screen.findByRole('region', { name: /activity over time/i })).toBeTruthy();
    expect(getPageViewTimeSeries).toHaveBeenCalledWith('24h');
    expect(chartMock).toHaveBeenCalled();
  });

  it('should refetch when a different range preset is selected', async () => {
    const user = userEvent.setup();
    await render(SiteAnalyticsActivityChartComponent, {
      providers: [
        {
          provide: AnalyticsService,
          useValue: { getPageViewTimeSeries }
        }
      ]
    });

    await screen.findByRole('region', { name: /activity over time/i });
    const initialCalls = getPageViewTimeSeries.mock.calls.length;

    await user.click(screen.getByRole('button', { name: '7d' }));

    expect(getPageViewTimeSeries.mock.calls.length).toBeGreaterThan(initialCalls);
    expect(getPageViewTimeSeries).toHaveBeenCalledWith('7d');
  });

  it('should render canvas for chart', async () => {
    const { container } = await render(SiteAnalyticsActivityChartComponent, {
      providers: [
        {
          provide: AnalyticsService,
          useValue: { getPageViewTimeSeries }
        }
      ]
    });

    await screen.findByRole('region', { name: /activity over time/i });
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('should not refetch when selecting the same range preset', async () => {
    const user = userEvent.setup();
    await render(SiteAnalyticsActivityChartComponent, {
      providers: [
        {
          provide: AnalyticsService,
          useValue: { getPageViewTimeSeries }
        }
      ]
    });

    await screen.findByRole('region', { name: /activity over time/i });
    const callsBefore = getPageViewTimeSeries.mock.calls.length;

    await user.click(screen.getByRole('button', { name: '24h' }));

    expect(getPageViewTimeSeries.mock.calls.length).toBe(callsBefore);
  });

  it('should switch display mode and re-render chart', async () => {
    const user = userEvent.setup();
    await render(SiteAnalyticsActivityChartComponent, {
      providers: [
        {
          provide: AnalyticsService,
          useValue: { getPageViewTimeSeries }
        }
      ]
    });

    await screen.findByRole('region', { name: /activity over time/i });
    const callsBefore = chartMock.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Line chart' }));

    expect(chartMock.mock.calls.length).toBeGreaterThan(callsBefore);
    const lastConfig = chartMock.mock.calls.at(-1)?.[1] as {
      data: { datasets: Array<{ type: string }> };
    };
    expect(lastConfig.data.datasets[0].type).toBe('line');
  });

  it('should format long-range labels and approval tooltips', async () => {
    getPageViewTimeSeries.mockResolvedValue([
      {
        bucketStart: '2023-06-01T12:00:00.000Z',
        count: 4,
        approvalCount: 2,
        approvalLabels: 'Prayer A\nPrayer B'
      },
      {
        bucketStart: '2023-06-02T12:00:00.000Z',
        count: 1,
        approvalCount: 0,
        approvalLabels: ''
      }
    ]);

    const user = userEvent.setup();
    await render(SiteAnalyticsActivityChartComponent, {
      providers: [
        {
          provide: AnalyticsService,
          useValue: { getPageViewTimeSeries }
        }
      ]
    });

    await screen.findByRole('region', { name: /activity over time/i });
    await user.click(screen.getByRole('button', { name: '90d' }));
    await screen.findByRole('region', { name: /activity over time/i });

    const chartConfig = chartMock.mock.calls.at(-1)?.[1] as {
      data: {
        labels: string[];
        datasets: Array<{
          pointRadius: (ctx: { raw?: unknown }) => number;
        }>;
      };
      options: {
        plugins: {
          tooltip: {
            filter: (item: { datasetIndex: number; raw: unknown }) => boolean;
            callbacks: {
              title: (items: { dataIndex?: number }[]) => string;
              label: (ctx: { datasetIndex: number; dataIndex: number; raw: unknown }) => string | string[];
            };
          };
        };
      };
    };

    expect(chartConfig.data.labels[0]).toMatch(/2023/);
    expect(chartConfig.data.datasets[1].pointRadius({ raw: 0 })).toBe(8);
    expect(chartConfig.data.datasets[1].pointRadius({ raw: null })).toBe(0);

    const tooltip = chartConfig.options.plugins.tooltip;
    expect(tooltip.filter({ datasetIndex: 1, raw: null })).toBe(false);
    expect(tooltip.filter({ datasetIndex: 0, raw: 4 })).toBe(true);
    expect(tooltip.callbacks.title([{ dataIndex: 0 }])).toBeTruthy();
    expect(tooltip.callbacks.label({ datasetIndex: 0, dataIndex: 0, raw: 4 })).toBe('Activity: 4');
    const approvalLabel = tooltip.callbacks.label({ datasetIndex: 1, dataIndex: 0, raw: 0 });
    expect(approvalLabel).toEqual(expect.arrayContaining(['2 approvals', 'Prayer A', 'Prayer B']));
    expect(tooltip.callbacks.label({ datasetIndex: 1, dataIndex: 1, raw: null })).toBe('');
  });
});
