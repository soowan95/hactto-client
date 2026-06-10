import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';
import type { WinningNumber } from '../../types';

export function AnalysisCharts() {
  const { appendAuth, showAlert } = useApp();
  const [rawData, setRawData] = useState<WinningNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<30 | 50 | 100 | 'all'>(50);

  // States to manage hover tooltips for line charts
  const [hoveredSumIndex, setHoveredSumIndex] = useState<number | null>(null);
  const [hoveredAcIndex, setHoveredAcIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchWinningNumbers = async () => {
      setLoading(true);
      try {
        const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers`));
        if (res.ok) {
          const d = await res.json();
          const list = d.data || d;
          setRawData(list);
        } else {
          throw new Error('당첨번호 데이터를 가져오지 못했습니다.');
        }
      } catch (err) {
        console.error(err);
        showAlert('error', '분석 차트 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWinningNumbers();
  }, [appendAuth, showAlert]);

  // Filter raw data and order chronologically (oldest to newest) for line charts
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Filter out items without analysis data just in case
    const withAnalysis = rawData.filter((item) => !!item.analysis);

    // Sort chronologically (oldest -> newest)
    const sorted = [...withAnalysis].sort((a, b) => a.episode - b.episode);

    // Limit to the chosen period (most recent N items from the end)
    const limited = period === 'all' ? sorted : sorted.slice(-period);

    return limited;
  }, [rawData, period]);

  // Calculations for charts
  const statsSummary = useMemo(() => {
    if (chartData.length === 0) return null;

    let totalOdd = 0;
    let totalEven = 0;

    let totalHot = 0;
    let totalWarm = 0;
    let totalCold = 0;

    let cnt0s = 0;
    let cnt10s = 0;
    let cnt20s = 0;
    let cnt30s = 0;
    let cnt40s = 0;

    chartData.forEach((item) => {
      const a = item.analysis!;
      totalOdd += a.odd || 0;
      totalEven += a.even || 0;

      totalHot += a.hot || 0;
      totalWarm += a.warm || 0;
      totalCold += a.cold || 0;

      cnt0s += a.cnt0s || 0;
      cnt10s += a.cnt10s || 0;
      cnt20s += a.cnt20s || 0;
      cnt30s += a.cnt30s || 0;
      cnt40s += a.cnt40s || 0;
    });

    const totalGames = chartData.length;

    return {
      totalGames,
      oddPct: Math.round((totalOdd / (totalOdd + totalEven)) * 100),
      evenPct: Math.round((totalEven / (totalOdd + totalEven)) * 100),
      avgHot: (totalHot / totalGames).toFixed(1),
      avgWarm: (totalWarm / totalGames).toFixed(1),
      avgCold: (totalCold / totalGames).toFixed(1),
      decades: [
        { label: '단번대', val: cnt0s, avg: (cnt0s / totalGames).toFixed(1) },
        { label: '10번대', val: cnt10s, avg: (cnt10s / totalGames).toFixed(1) },
        { label: '20번대', val: cnt20s, avg: (cnt20s / totalGames).toFixed(1) },
        { label: '30번대', val: cnt30s, avg: (cnt30s / totalGames).toFixed(1) },
        { label: '40번대', val: cnt40s, avg: (cnt40s / totalGames).toFixed(1) },
      ],
    };
  }, [chartData]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '350px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(0, 240, 255, 0.1)',
            borderTopColor: 'var(--primary-cyan)',
            borderRadius: '50%',
            animation: 'spinner 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
          당첨 분석 데이터를 로드하고 있습니다...
        </p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-dim)',
        }}
      >
        표출할 차트 데이터가 존재하지 않습니다.
      </div>
    );
  }

  // Dimension helpers for line charts (Optimized for full-width 1000px display)
  const width = 1000;
  const height = 240;
  const padding = { top: 25, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 1. Sum chart min/max scaling
  const sums = chartData.map((d) => d.analysis!.sum);
  const minSum = Math.max(21, Math.min(...sums) - 5);
  const maxSum = Math.min(255, Math.max(...sums) + 5);

  const getSumCoords = (val: number, idx: number, total: number) => {
    const x = padding.left + (idx / (total - 1)) * chartW;
    const y =
      padding.top + chartH - ((val - minSum) / (maxSum - minSum)) * chartH;
    return { x, y };
  };

  // Generate paths for Sum Line Chart
  const sumPoints = chartData.map((d, i) =>
    getSumCoords(d.analysis!.sum, i, chartData.length),
  );
  const sumPathD = sumPoints.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
    '',
  );
  const sumAreaD =
    sumPoints.length > 0
      ? `${sumPathD} L ${sumPoints[sumPoints.length - 1].x} ${padding.top + chartH} L ${sumPoints[0].x} ${padding.top + chartH} Z`
      : '';

  // 2. AC chart min/max scaling (typically AC is between 0 and 10, now set to 0..15 by default)
  const minAc = 0;
  const maxAc = 15;

  const getAcCoords = (val: number, idx: number, total: number) => {
    const x = padding.left + (idx / (total - 1)) * chartW;
    const y = padding.top + chartH - ((val - minAc) / (maxAc - minAc)) * chartH;
    return { x, y };
  };

  // Generate paths for AC Line Chart
  const acPoints = chartData.map((d, i) =>
    getAcCoords(d.analysis!.ac, i, chartData.length),
  );
  const acPathD = acPoints.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
    '',
  );
  const acAreaD =
    acPoints.length > 0
      ? `${acPathD} L ${acPoints[acPoints.length - 1].x} ${padding.top + chartH} L ${acPoints[0].x} ${padding.top + chartH} Z`
      : '';

  // Grid line levels for Sum
  const sumGridLines = [
    minSum + (maxSum - minSum) * 0.25,
    minSum + (maxSum - minSum) * 0.5,
    minSum + (maxSum - minSum) * 0.75,
  ];

  // Grid line levels for AC
  const acGridLines = [5, 10];

  return (
    <div style={{ color: '#ffffff', paddingBottom: '20px' }}>
      {/* Title & Period Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              margin: 0,
            }}
          >
            역대 당첨번호 종합 통계 차트
          </h2>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              marginTop: '4px',
            }}
          >
            데이터베이스에 동기화된 역대 당첨 결과를 바탕으로 통계 트렌드를
            시각화합니다.
          </p>
        </div>

        {/* Period selection tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {([30, 50, 100, 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setHoveredSumIndex(null);
                setHoveredAcIndex(null);
              }}
              style={{
                background:
                  period === p ? 'var(--primary-cyan)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: period === p ? '#030712' : 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: period === p ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {p === 'all' ? '전체' : `${p}회`}
            </button>
          ))}
        </div>
      </div>

      {/* 100% Width Line Charts (Each occupies a full row) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Chart 1: Sum Trendline */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: 'none',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: 'var(--text-main)',
              }}
            >
              총합 변동 추이 (Sum Trend)
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-cyan)',
                fontFamily: 'monospace',
              }}
            >
              범위: {minSum + 5} ~ {maxSum - 5}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto' }}
          >
            <defs>
              <linearGradient id="sumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary-cyan)"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary-cyan)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={width - padding.right}
              y2={padding.top}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="3 3"
            />
            {sumGridLines.map((level, i) => {
              const y =
                padding.top +
                chartH -
                ((level - minSum) / (maxSum - minSum)) * chartH;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="var(--text-dim)"
                    fontSize="9"
                    textAnchor="end"
                  >
                    {Math.round(level)}
                  </text>
                </g>
              );
            })}
            <line
              x1={padding.left}
              y1={padding.top + chartH}
              x2={width - padding.right}
              y2={padding.top + chartH}
              stroke="rgba(255,255,255,0.08)"
            />

            {/* Y Boundary Texts */}
            <text
              x={padding.left - 8}
              y={padding.top + 3}
              fill="var(--text-dim)"
              fontSize="9"
              textAnchor="end"
            >
              {maxSum - 5}
            </text>
            <text
              x={padding.left - 8}
              y={padding.top + chartH + 3}
              fill="var(--text-dim)"
              fontSize="9"
              textAnchor="end"
            >
              {minSum + 5}
            </text>

            {/* X Axis Labels */}
            {chartData.map((d, i) => {
              const total = chartData.length;
              const step = Math.max(1, Math.ceil(total / 12));
              if (i % step === 0 || i === total - 1) {
                if (
                  i === total - 1 &&
                  (total - 1) % step < step / 2 &&
                  (total - 1) % step !== 0
                ) {
                  return null;
                }
                const p = getSumCoords(d.analysis!.sum, i, total);
                let anchor: 'start' | 'end' | 'middle' = 'middle';
                if (i === 0) anchor = 'start';
                else if (i === total - 1) anchor = 'end';

                return (
                  <text
                    key={i}
                    x={p.x}
                    y={height - 5}
                    fill="var(--text-dim)"
                    fontSize="9.5"
                    textAnchor={anchor}
                  >
                    {d.episode}회
                  </text>
                );
              }
              return null;
            })}

            {/* Area Path */}
            <path d={sumAreaD} fill="url(#sumGrad)" />

            {/* Line Path */}
            <path
              d={sumPathD}
              fill="none"
              stroke="var(--primary-cyan)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.4))' }}
            />

            {/* Interactive dots & hover interaction zones */}
            {sumPoints.map((p, i) => {
              const isActive = hoveredSumIndex === i;
              return (
                <g key={i}>
                  {/* Invisible rect for easier hover targeting */}
                  <rect
                    x={p.x - chartW / (chartData.length * 2)}
                    y={padding.top}
                    width={chartW / Math.max(1, chartData.length - 1)}
                    height={chartH}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredSumIndex(i)}
                    onMouseLeave={() => setHoveredSumIndex(null)}
                  />
                  {isActive && (
                    <>
                      {/* Vertical highlight line */}
                      <line
                        x1={p.x}
                        y1={padding.top}
                        x2={p.x}
                        y2={padding.top + chartH}
                        stroke="rgba(0, 240, 255, 0.25)"
                        strokeWidth="1"
                      />
                      {/* Glowing dot */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={6}
                        fill="var(--primary-cyan)"
                        opacity="0.3"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={4.5}
                        fill="#ffffff"
                        stroke="var(--primary-cyan)"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                  {/* Small static dots for lower density periods */}
                  {chartData.length <= 50 && !isActive && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={2}
                      fill="var(--primary-cyan)"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* HTML Tooltip overlay */}
          {hoveredSumIndex !== null && chartData[hoveredSumIndex] && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(10, 11, 18, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                {chartData[hoveredSumIndex].episode}회차
              </div>
              <div style={{ marginTop: '2px' }}>
                총합:{' '}
                <span
                  style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}
                >
                  {chartData[hoveredSumIndex].analysis!.sum}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: AC Trendline */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: 'none',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: 'var(--text-main)',
              }}
            >
              AC값 변동 추이 (AC Value Trend)
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-purple)',
                fontFamily: 'monospace',
              }}
            >
              범위: {minAc} ~ {maxAc}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto' }}
          >
            <defs>
              <linearGradient id="acGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary-purple)"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary-purple)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={width - padding.right}
              y2={padding.top}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="3 3"
            />
            {acGridLines.map((level, i) => {
              const y =
                padding.top +
                chartH -
                ((level - minAc) / (maxAc - minAc)) * chartH;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="var(--text-dim)"
                    fontSize="9"
                    textAnchor="end"
                  >
                    {Math.round(level)}
                  </text>
                </g>
              );
            })}
            <line
              x1={padding.left}
              y1={padding.top + chartH}
              x2={width - padding.right}
              y2={padding.top + chartH}
              stroke="rgba(255,255,255,0.08)"
            />

            {/* Y Boundary Texts */}
            <text
              x={padding.left - 8}
              y={padding.top + 3}
              fill="var(--text-dim)"
              fontSize="9"
              textAnchor="end"
            >
              {maxAc}
            </text>
            <text
              x={padding.left - 8}
              y={padding.top + chartH + 3}
              fill="var(--text-dim)"
              fontSize="9"
              textAnchor="end"
            >
              {minAc}
            </text>

            {/* X Axis Labels */}
            {chartData.map((d, i) => {
              const total = chartData.length;
              const step = Math.max(1, Math.ceil(total / 12));
              if (i % step === 0 || i === total - 1) {
                if (
                  i === total - 1 &&
                  (total - 1) % step < step / 2 &&
                  (total - 1) % step !== 0
                ) {
                  return null;
                }
                const p = getAcCoords(d.analysis!.ac, i, total);
                let anchor: 'start' | 'end' | 'middle' = 'middle';
                if (i === 0) anchor = 'start';
                else if (i === total - 1) anchor = 'end';

                return (
                  <text
                    key={i}
                    x={p.x}
                    y={height - 5}
                    fill="var(--text-dim)"
                    fontSize="9.5"
                    textAnchor={anchor}
                  >
                    {d.episode}회
                  </text>
                );
              }
              return null;
            })}

            {/* Area Path */}
            <path d={acAreaD} fill="url(#acGrad)" />

            {/* Line Path */}
            <path
              d={acPathD}
              fill="none"
              stroke="var(--primary-purple)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(189, 0, 255, 0.4))' }}
            />

            {/* Interactive dots */}
            {acPoints.map((p, i) => {
              const isActive = hoveredAcIndex === i;
              return (
                <g key={i}>
                  <rect
                    x={p.x - chartW / (chartData.length * 2)}
                    y={padding.top}
                    width={chartW / Math.max(1, chartData.length - 1)}
                    height={chartH}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredAcIndex(i)}
                    onMouseLeave={() => setHoveredAcIndex(null)}
                  />
                  {isActive && (
                    <>
                      <line
                        x1={p.x}
                        y1={padding.top}
                        x2={p.x}
                        y2={padding.top + chartH}
                        stroke="rgba(189, 0, 255, 0.25)"
                        strokeWidth="1"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={6}
                        fill="var(--primary-purple)"
                        opacity="0.3"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={4.5}
                        fill="#ffffff"
                        stroke="var(--primary-purple)"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                  {chartData.length <= 50 && !isActive && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={2}
                      fill="var(--primary-purple)"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {hoveredAcIndex !== null && chartData[hoveredAcIndex] && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(10, 11, 18, 0.85)',
                border: '1px solid rgba(189, 0, 255, 0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                {chartData[hoveredAcIndex].episode}회차
              </div>
              <div style={{ marginTop: '2px' }}>
                AC값:{' '}
                <span
                  style={{ color: 'var(--primary-purple)', fontWeight: 'bold' }}
                >
                  {chartData[hoveredAcIndex].analysis!.ac}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid for smaller distribution charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {/* Chart 3: Decades Distribution */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: 'none',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '16px',
            }}
          >
            번대수 분포 빈도 (Decade Distribution)
          </span>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {statsSummary?.decades.map((d, i) => {
              // Custom colors per decade
              const colors = [
                'linear-gradient(90deg, #ff4e50 0%, #f9d423 100%)', // 0s (Red to Orange)
                'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)', // 10s (Pink to Red)
                'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', // 20s (Blue to Cyan)
                'linear-gradient(90deg, #b1f2ff 0%, #bd00ff 100%)', // 30s (Purple to Neon)
                'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)', // 40s (Green / Mint)
              ];

              const totalDecadeCounts =
                statsSummary.decades.reduce((sum, d) => sum + d.val, 0) || 1;
              const percent = Math.round((d.val / totalDecadeCounts) * 100);

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span
                      style={{ color: 'var(--text-main)', fontWeight: 600 }}
                    >
                      {d.label}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>
                      평균{' '}
                      <span
                        style={{
                          color: 'var(--text-main)',
                          fontWeight: 'bold',
                        }}
                      >
                        {d.avg}개
                      </span>{' '}
                      ({percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: colors[i],
                        borderRadius: '4px',
                        transition: 'width 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Temperature Distribution */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: 'none',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '16px',
            }}
          >
            출현 번호 온도 분포 (Temperature Distribution)
          </span>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-end',
              height: '120px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '12px',
            }}
          >
            {[
              {
                type: 'HOT',
                label: '열번호 🔥',
                avg: statsSummary?.avgHot,
                color: '#ef4444',
                gradient: 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)',
              },
              {
                type: 'WARM',
                label: '온번호 🟠',
                avg: statsSummary?.avgWarm,
                color: '#f97316',
                gradient: 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)',
              },
              {
                type: 'COLD',
                label: '냉번호 ❄️',
                avg: statsSummary?.avgCold,
                color: '#3b82f6',
                gradient: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
              },
            ].map((t) => {
              const val = parseFloat(t.avg || '0');
              const heightPct = Math.min(100, Math.max(10, (val / 6) * 100)); // Max is 6 balls

              return (
                <div
                  key={t.type}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '70px',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: t.color,
                    }}
                  >
                    {t.avg}개
                  </span>
                  <div
                    style={{
                      height: `${heightPct * 0.7}px`,
                      width: '32px',
                      background: t.gradient,
                      borderRadius: '6px 6px 0 0',
                      boxShadow: `0 0 10px rgba(${t.type === 'HOT' ? '239,68,68' : t.type === 'WARM' ? '249,115,22' : '59,130,246'}, 0.25)`,
                      transition: 'height 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-dim)',
              lineHeight: '1.4',
              margin: 0,
            }}
          >
            * <b>열번호 🔥:</b> 최근 5회차 이내 다득점 번호들
            <br />* <b>온번호 🟠:</b> 최근 6~10회차 출현 이력이 있는 번호들
            <br />* <b>냉번호 ❄️:</b> 최근 10회차 이상 출현하지 않은 미출현
            번호들
          </p>
        </div>
      </div>

      {/* Full width Gauge Card: Odd/Even Ratio */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.015)',
          maxHeight: 'none',
          overflow: 'hidden',
          minWidth: 0,
          marginTop: '16px',
        }}
      >
        <span
          style={{
            fontSize: '0.88rem',
            fontWeight: 'bold',
            color: 'var(--text-main)',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          홀수 vs 짝수 비율 (Odd vs Even Ratio)
        </span>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          {/* Circular Donut gauge */}
          <div
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              flexShrink: 0,
            }}
          >
            <svg width="80" height="80" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="12"
              />
              {/* Even (Cyan) Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--primary-cyan)"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={
                  251.2 - (251.2 * (statsSummary?.evenPct || 50)) / 100
                }
                transform={`rotate(${-90 + (360 * (statsSummary?.oddPct || 50)) / 100} 50 50)`}
                style={{
                  transition:
                    'transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), stroke-dashoffset 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)',
                  filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.3))',
                }}
              />
              {/* Odd (Purple) Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--primary-purple)"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={
                  251.2 - (251.2 * (statsSummary?.oddPct || 50)) / 100
                }
                transform="rotate(-90 50 50)"
                style={{
                  transition:
                    'stroke-dashoffset 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)',
                  filter: 'drop-shadow(0 0 4px rgba(189, 0, 255, 0.3))',
                }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                }}
              >
                {statsSummary?.oddPct}:{statsSummary?.evenPct}
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>
                홀:짝
              </span>
            </div>
          </div>

          {/* Description list / segmented bars */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '0.76rem',
              }}
            >
              <span
                style={{ color: 'var(--primary-purple)', fontWeight: 'bold' }}
              >
                홀수 (Odd): {statsSummary?.oddPct}%
              </span>
              <span
                style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}
              >
                짝수 (Even): {statsSummary?.evenPct}%
              </span>
            </div>

            {/* Segmented bar */}
            <div
              style={{
                height: '12px',
                width: '100%',
                borderRadius: '6px',
                display: 'flex',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: `${statsSummary?.oddPct}%`,
                  background:
                    'linear-gradient(90deg, #bd00ff 0%, #e879f9 100%)',
                  transition: 'width 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)',
                }}
              />
              <div
                style={{
                  width: `${statsSummary?.evenPct}%`,
                  background:
                    'linear-gradient(90deg, #22d3ee 0%, #00f0ff 100%)',
                  transition: 'width 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)',
                }}
              />
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginTop: '12px',
            lineHeight: '1.4',
            margin: 0,
            textAlign: 'left',
          }}
        >
          선택한 최근 <b>{period === 'all' ? '전체' : `${period}회차`}</b> 동안
          출현한 전체 당첨번호 공들 중 홀수와 짝수의 비율입니다. 이론상 로또
          홀짝 비율의 확률적 기댓값은 약 50:50에 수렴합니다.
        </p>
      </div>
    </div>
  );
}

export default AnalysisCharts;
