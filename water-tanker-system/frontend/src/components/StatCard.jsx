import './StatCard.css';

const StatCard = ({ title, value, icon, color = 'blue', subtitle, trend }) => {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__header">
        <div className={`stat-card__icon stat-icon--${color}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__title">{title}</div>
      {subtitle && <div className="stat-card__sub">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
