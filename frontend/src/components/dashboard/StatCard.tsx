import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accentColor = '#6366F1',
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {icon && <div className="stat-card-icon" style={{ color: accentColor }}>{icon}</div>}
      </div>
      <div className="stat-card-value" style={{ color: accentColor }}>
        {value}
      </div>
    </div>
  );
};
