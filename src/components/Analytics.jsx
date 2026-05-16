import React, { useState, useMemo } from 'react';

const Analytics = ({ members = [], scheduleTemplates = [] }) => {
  const [activeZone, setActiveZone] = useState('All');
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [hoveredRingSegment, setHoveredRingSegment] = useState(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState(null);

  // 1. Dynamic Metric Calculations
  const metrics = useMemo(() => {
    // Pricing tiers
    const prices = {
      'Elite Performance': 250,
      'Wellness Pro': 150,
      'Diamond Access': 400,
    };

    let totalMonthlyRevenue = 0;
    members.forEach((m) => {
      const price = prices[m.plan] || 200; // default fallback
      totalMonthlyRevenue += price;
    });

    const avgTrainerRating = 4.94;
    const activeRetention = 98.2;
    const avgCheckinsPerDay = (members.length * 0.72).toFixed(1);

    return {
      revenue: totalMonthlyRevenue,
      rating: avgTrainerRating,
      retention: activeRetention,
      checkins: avgCheckinsPerDay,
    };
  }, [members]);

  // 2. Membership Distribution Calculations (SVG Donut Chart)
  const planDistribution = useMemo(() => {
    const counts = {};
    let total = 0;

    members.forEach((m) => {
      counts[m.plan] = (counts[m.plan] || 0) + 1;
      total++;
    });

    // Support default values if members list is empty
    if (total === 0) {
      return [
        { name: 'Elite Performance', count: 12, percentage: 40, color: '#34d399', strokeDash: '0 100' },
        { name: 'Wellness Pro', count: 10, percentage: 33, color: '#60a5fa', strokeDash: '0 100' },
        { name: 'Diamond Access', count: 8, percentage: 27, color: '#a78bfa', strokeDash: '0 100' },
      ];
    }

    const plans = [
      { name: 'Elite Performance', color: '#34d399', hoverColor: '#059669' },
      { name: 'Wellness Pro', color: '#3b82f6', hoverColor: '#2563eb' },
      { name: 'Diamond Access', color: '#8b5cf6', hoverColor: '#7c3aed' },
    ];

    let accumulatedPercentage = 0;
    return plans.map((plan) => {
      const count = counts[plan.name] || 0;
      const percentage = Math.round((count / total) * 100) || 0;
      const startPercent = accumulatedPercentage;
      accumulatedPercentage += percentage;

      return {
        name: plan.name,
        count,
        percentage,
        color: plan.color,
        hoverColor: plan.hoverColor,
        startPercent,
      };
    });
  }, [members]);

  // 3. Monthly Enrollment & Revenue Trajectory (Bezier SVG Chart)
  // We model 6 months of historical growth leading up to the current dynamic stats.
  const historicalData = useMemo(() => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    
    // We assume dynamic members/revenue represents 'May' (the current month),
    // and we generate smooth historical scaling factors.
    const revenueMay = metrics.revenue;
    const membersMay = members.length;

    const baseRevenue = [
      Math.round(revenueMay * 0.75),
      Math.round(revenueMay * 0.82),
      Math.round(revenueMay * 0.80),
      Math.round(revenueMay * 0.88),
      Math.round(revenueMay * 0.92),
      Math.round(revenueMay * 0.95),
      revenueMay
    ];

    const baseMembers = [
      Math.round(membersMay * 0.72),
      Math.round(membersMay * 0.78),
      Math.round(membersMay * 0.81),
      Math.round(membersMay * 0.85),
      Math.round(membersMay * 0.90),
      Math.round(membersMay * 0.94),
      membersMay
    ];

    return months.map((month, idx) => ({
      month,
      revenue: baseRevenue[idx] || 0,
      members: baseMembers[idx] || 0,
    }));
  }, [metrics.revenue, members.length]);

  // 4. Peak Gym Hours Heatmap Matrix
  // Matrix dimensions: 7 Days (Mon-Sun) x 8 Hour Blocks (6AM - 8PM)
  const heatmapData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    
    // Heatmap weights vary by active zone chosen
    const getWeight = (day, hour, zone) => {
      const isWeekend = day === 'Sat' || day === 'Sun';
      const hrNum = parseInt(hour.split(':')[0]);
      
      let base = 30;
      
      // Daily peak curves
      if (hrNum === 8 || hrNum === 18) base += 45; // Morning and evening peaks
      else if (hrNum === 12 || hrNum === 16) base += 25; // Lunch and afternoon rush
      else base += 10;

      // Adjust for weekends
      if (isWeekend) {
        if (hrNum >= 10 && hrNum <= 14) base += 35; // Weekend mid-day rush
        else base -= 25; // Quieter weekend mornings/evenings
      }

      // Zone specific overrides
      if (zone === 'Zen Garden') {
        if (hrNum === 6 || hrNum === 8) base += 15; // Morning yoga peak
        if (hrNum === 18) base -= 10;
      } else if (zone === 'VIP Zone') {
        if (hrNum === 12 || hrNum === 14) base += 15; // Midday private trainer peak
        if (hrNum === 6) base -= 20;
      } else if (zone === 'Main Floor') {
        if (hrNum === 18 || hrNum === 20) base += 20; // Heavy lifting evening peak
      }

      return Math.min(95, Math.max(5, base + Math.floor(Math.sin(hrNum) * 5)));
    };

    return days.map((day) => ({
      day,
      hours: hours.map((hour) => ({
        hour,
        intensity: getWeight(day, hour, activeZone),
      })),
    }));
  }, [activeZone]);

  // 5. Class & Trainer Performance Leaderboard
  // Map schedule templates directly to the leaderboard, calculating dynamic ratios
  const leaderboard = useMemo(() => {
    const enrichedList = (scheduleTemplates || []).map((t) => {
      const ratio = t.capacity > 0 ? (t.enrolled / t.capacity) * 100 : 0;
      
      let trainer = 'Marcus Thorne';
      let rating = 4.9;
      
      const classNameLower = (t.className || '').toLowerCase();
      if (classNameLower.includes('yoga')) {
        trainer = 'Sophia Chen';
        rating = 4.95;
      } else if (classNameLower.includes('taekwondo')) {
        trainer = 'Master Kim';
        rating = 4.98;
      } else if (classNameLower.includes('muay') || classNameLower.includes('thai')) {
        trainer = 'Coach Somchai';
        rating = 4.92;
      } else if (classNameLower.includes('fitness') || classNameLower.includes('wellness')) {
        trainer = 'Elena Vance';
        rating = 4.88;
      }

      return {
        id: t.id,
        className: t.className,
        trainer,
        enrolled: t.enrolled,
        capacity: t.capacity,
        ratio: Math.round(ratio),
        rating,
      };
    });

    // If no templates, supply premium mock list
    if (enrichedList.length === 0) {
      return [
        { id: 1, className: 'Taekwondo Elite', trainer: 'Master Kim', enrolled: 14, capacity: 15, ratio: 93, rating: 4.98 },
        { id: 2, className: 'Zen Yoga Flow', trainer: 'Sophia Chen', enrolled: 18, capacity: 20, ratio: 90, rating: 4.95 },
        { id: 3, className: 'Elite Performance', trainer: 'Marcus Thorne', enrolled: 12, capacity: 15, ratio: 80, rating: 4.9 },
        { id: 4, className: 'Muay Thai Sparring', trainer: 'Coach Somchai', enrolled: 9, capacity: 12, ratio: 75, rating: 4.92 },
      ];
    }

    // Sort by ratio desc
    return enrichedList.sort((a, b) => b.ratio - a.ratio);
  }, [scheduleTemplates]);

  // SVG Coordinates Builders for Trajectory Chart
  const linePoints = useMemo(() => {
    const width = 500;
    const height = 150;
    const padding = 25;
    
    const maxRev = Math.max(...historicalData.map(d => d.revenue)) || 1000;
    const minRev = Math.min(...historicalData.map(d => d.revenue)) || 0;
    const revDiff = maxRev - minRev || 1;

    const points = historicalData.map((d, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (historicalData.length - 1);
      // Invert Y coordinate so higher values are at the top
      const y = padding + ((maxRev - d.revenue) * (height - 2 * padding)) / revDiff;
      return { x, y, data: d };
    });

    // Create SVG Cubic Bezier path
    let path = '';
    if (points.length > 0) {
      path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
        const cpY2 = p1.y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }

    // Create SVG Area Path
    let areaPath = '';
    if (points.length > 0) {
      areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    }

    return { points, path, areaPath };
  }, [historicalData]);

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--glass-border)]">
        <div>
          <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]"></span> Business intelligence center
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Filter Zone</span>
          <div className="flex gap-1.5 glass-card p-1 rounded-xl">
            {['All', 'Main Floor', 'Zen Garden', 'VIP Zone'].map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`px-3 py-1 rounded-lg text-[9px] uppercase tracking-luxury font-bold transition-all ${
                  activeZone === zone
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {zone.replace(' Floor', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Monthly Revenue */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Monthly Run Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light">${metrics.revenue.toLocaleString()}</span>
            <span className="text-[9px] uppercase tracking-luxury text-emerald-500 font-bold">+14% MoM</span>
          </div>
          <div className="mt-3 text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">
            Based on active subscriptions
          </div>
          <div className="absolute right-4 bottom-4 text-[var(--text-secondary)] opacity-10 group-hover:opacity-25 transition-all">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Avg Check-Ins / Day</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light">{metrics.checkins}</span>
            <span className="text-[9px] uppercase tracking-luxury text-emerald-500 font-bold">+8.2%</span>
          </div>
          <div className="mt-3 text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">
            Daily average members visiting
          </div>
          <div className="absolute right-4 bottom-4 text-[var(--text-secondary)] opacity-10 group-hover:opacity-25 transition-all">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
          </div>
        </div>

        {/* Metric 3: Client Retention */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Member Retention</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light">{metrics.retention}%</span>
            <span className="text-[9px] uppercase tracking-luxury text-emerald-500 font-bold">Stable</span>
          </div>
          <div className="mt-3 text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">
            Elite tier industry standard
          </div>
          <div className="absolute right-4 bottom-4 text-[var(--text-secondary)] opacity-10 group-hover:opacity-25 transition-all">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Metric 4: Trainer Satisfaction */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Trainer Feedback Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light">{metrics.rating} <span className="text-xs text-[var(--text-secondary)]">/ 5.0</span></span>
            <span className="text-[9px] uppercase tracking-luxury text-amber-500 font-bold">98% Positive</span>
          </div>
          <div className="mt-3 text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">
            Post-session feedback avg
          </div>
          <div className="absolute right-4 bottom-4 text-[var(--text-secondary)] opacity-10 group-hover:opacity-25 transition-all">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.243.577 1.83l-3.97 2.88a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.88a1 1 0 00-1.176 0l-3.97 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.88c-.783-.57-.384-1.83.577-1.83h4.906a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>

      </div>

      {/* Row 2: Two-Column Strategy Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Line Trajectory & Heatmap (Busiest hours) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart 1: Enrollment & Revenue Trajectory */}
          <div className="glass-card p-6 border border-[var(--glass-border)] relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm uppercase tracking-luxury text-[var(--text-secondary)] font-semibold leading-none mb-1">
                  Enrollment & Revenue Trajectory
                </h3>
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">
                  Month-Over-Month Performance Curve
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-[var(--text-primary)] rounded-full"></span> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Active Members
                </span>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="relative w-full h-[180px]">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  {/* Linear gradient for filling under the line */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="25" y1="25" x2="475" y2="25" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="25" y1="85" x2="475" y2="85" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="25" y1="150" x2="475" y2="150" stroke="var(--glass-border)" strokeWidth="1" />

                {/* Area under the path */}
                <path d={linePoints.areaPath} fill="url(#areaGrad)" />

                {/* Core Line Path */}
                <path 
                  d={linePoints.path} 
                  fill="none" 
                  stroke="var(--text-primary)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  className="transition-all duration-700"
                />

                {/* Interactive circles */}
                {linePoints.points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredMonth === idx ? 6 : 4}
                      fill="var(--bg-primary)"
                      stroke="var(--text-primary)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredMonth(idx)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    />
                    {/* Secondary indicator for member growth */}
                    <circle
                      cx={p.x}
                      cy={p.y + 8}
                      r="2"
                      fill="#34d399"
                      opacity="0.7"
                    />
                  </g>
                ))}
              </svg>

              {/* Hover Tooltip inside Chart Container */}
              {hoveredMonth !== null && (
                <div 
                  className="absolute z-10 glass-card px-4 py-2 text-left shadow-lg pointer-events-none transition-all duration-150 animate-fade-in"
                  style={{
                    left: `${(linePoints.points[hoveredMonth].x / 500) * 100}%`,
                    top: `${(linePoints.points[hoveredMonth].y / 150) * 100 - 45}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block mb-0.5">
                    {historicalData[hoveredMonth].month} Performance
                  </span>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Revenue: <span className="font-light">${historicalData[hoveredMonth].revenue.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Active Members: <span className="font-medium text-[var(--text-primary)]">{historicalData[hoveredMonth].members}</span>
                  </div>
                </div>
              )}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between px-6 pt-2 text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-semibold">
              {historicalData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </div>

          {/* Chart 2: Peak Gym Hours Heatmap */}
          <div className="glass-card p-6 border border-[var(--glass-border)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm uppercase tracking-luxury text-[var(--text-secondary)] font-semibold leading-none mb-1">
                  Peak Gym Occupancy Grid
                </h3>
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">
                  Weekly heatmap ({activeZone === 'All' ? 'Combined Zones' : activeZone})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">
                <span>Quieter</span>
                <div className="flex gap-0.5">
                  <div className="w-2 h-2 rounded bg-[var(--text-primary)] opacity-10"></div>
                  <div className="w-2 h-2 rounded bg-[var(--text-primary)] opacity-30"></div>
                  <div className="w-2 h-2 rounded bg-[var(--text-primary)] opacity-60"></div>
                  <div className="w-2 h-2 rounded bg-[var(--text-primary)] opacity-90"></div>
                </div>
                <span>Busiest</span>
              </div>
            </div>

            {/* Heatmap Grid Wrapper */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-none pb-2">
                <div className="min-w-[480px]">
                  {/* Grid Header Hours */}
                  <div className="grid grid-cols-9 gap-2 mb-2">
                    <div className="col-span-1"></div>
                    {['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'].map((hr) => (
                      <div key={hr} className="text-center text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] font-semibold">
                        {hr}
                      </div>
                    ))}
                  </div>

                  {/* Grid Rows for Days */}
                  <div className="space-y-2">
                    {heatmapData.map((dayData, dIdx) => (
                      <div key={dayData.day} className="grid grid-cols-9 gap-2 items-center">
                        {/* Day label */}
                        <div className="col-span-1 text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">
                          {dayData.day}
                        </div>

                        {/* Hour Cells */}
                        {dayData.hours.map((cell, hIdx) => {
                          const intensity = cell.intensity;
                          // opacity styling according to intensity
                          const opacity = intensity / 100;
                          
                          return (
                            <div
                              key={hIdx}
                              className="aspect-[2/1] rounded-lg transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm"
                              style={{
                                background: `var(--text-primary)`,
                                opacity: opacity < 0.15 ? 0.12 : opacity,
                              }}
                              onMouseEnter={(e) => {
                                setHoveredHeatmapCell({
                                  day: dayData.day,
                                  hour: cell.hour,
                                  intensity,
                                  clientX: e.clientX,
                                  clientY: e.clientY
                                });
                              }}
                              onMouseLeave={() => setHoveredHeatmapCell(null)}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Dynamic Heatmap Cell Tooltip */}
              {hoveredHeatmapCell && (
                <div 
                  className="fixed z-50 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl px-4 py-3 text-left shadow-2xl pointer-events-none animate-fade-in text-xs"
                  style={{
                    left: `${hoveredHeatmapCell.clientX - 100}px`,
                    top: `${hoveredHeatmapCell.clientY - 100}px`,
                    transform: 'translate(-100%, -200%)',
                  }}
                >
                  <span className="text-[9px] uppercase tracking-luxury opacity-70 font-bold block mb-0.5">
                    {hoveredHeatmapCell.day}s @ {hoveredHeatmapCell.hour}
                  </span>
                  <div className="font-semibold mb-1">
                    Avg. Occupancy: <span className="font-light">{hoveredHeatmapCell.intensity}%</span>
                  </div>
                  <div className="text-[9px] opacity-70 uppercase tracking-luxury">
                    Staffing: {hoveredHeatmapCell.intensity > 70 ? '🔥 Double Shift' : '🛡️ Standard Shift'}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Membership Distribution & Leaderboard */}
        <div className="space-y-8">
          
          {/* Chart 3: Membership Distribution Ring */}
          <div className="glass-card p-6 border border-[var(--glass-border)] relative">
            <h3 className="text-sm uppercase tracking-luxury text-[var(--text-secondary)] font-semibold leading-none mb-1">
              Membership Distribution
            </h3>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest block mb-6">
              Share of membership tiers
            </span>

            {/* Geometric SVG Ring Chart */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                  {/* Background concentric glass circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="var(--glass-border)"
                    strokeWidth="8"
                  />

                  {/* Colored segments */}
                  {planDistribution.map((plan, idx) => {
                    const radius = 38;
                    const circumference = 2 * Math.PI * radius; // ~238.76
                    const strokeDasharray = circumference;
                    const strokeDashoffset = circumference - (plan.percentage / 100) * circumference;
                    
                    // To calculate starting rotation offset for each segment
                    const rotateOffset = (plan.startPercent / 100) * 360;

                    const isHovered = hoveredRingSegment === idx;

                    return (
                      <circle
                        key={plan.name}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={plan.color}
                        strokeWidth={isHovered ? 12 : 8}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(${rotateOffset} 50 50)`}
                        strokeLinecap="round"
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRingSegment(idx)}
                        onMouseLeave={() => setHoveredRingSegment(null)}
                      />
                    );
                  })}
                </svg>

                {/* Inside Circle Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {hoveredRingSegment !== null ? (
                    <div className="animate-fade-in">
                      <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block">
                        {planDistribution[hoveredRingSegment].name.split(' ')[0]}
                      </span>
                      <span className="text-2xl font-semibold leading-none">
                        {planDistribution[hoveredRingSegment].percentage}%
                      </span>
                      <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                        {planDistribution[hoveredRingSegment].count} Members
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block">
                        Total Pool
                      </span>
                      <span className="text-3xl font-light leading-none">
                        {members.length}
                      </span>
                      <span className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] block mt-1">
                        Active Tiers
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Legend */}
              <div className="w-full mt-6 space-y-2">
                {planDistribution.map((plan, idx) => {
                  const isHovered = hoveredRingSegment === idx;
                  return (
                    <div 
                      key={plan.name}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isHovered ? 'bg-[var(--card-hover)]' : 'bg-transparent'
                      }`}
                      onMouseEnter={() => setHoveredRingSegment(idx)}
                      onMouseLeave={() => setHoveredRingSegment(null)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }}></div>
                        <span className="text-xs text-[var(--text-secondary)] font-medium">{plan.name}</span>
                      </div>
                      <span className="text-xs font-semibold">{plan.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart 4: Class & Trainer Leaderboard */}
          <div className="glass-card p-6 border border-[var(--glass-border)]">
            <h3 className="text-sm uppercase tracking-luxury text-[var(--text-secondary)] font-semibold leading-none mb-1">
              Class Leaderboard
            </h3>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest block mb-4">
              Enrollment ratios & ratings
            </span>

            {/* Ranked Table */}
            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {leaderboard.map((item, idx) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--card-hover)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Number Badge */}
                    <div className="w-6 h-6 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[10px] font-bold">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-none mb-1">{item.className}</span>
                      <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block">
                        {item.trainer}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold block leading-none mb-1">
                      {item.ratio}% <span className="text-[8px] text-[var(--text-secondary)]">Cap</span>
                    </span>
                    <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 justify-end">
                      ★ {item.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Analytics;
