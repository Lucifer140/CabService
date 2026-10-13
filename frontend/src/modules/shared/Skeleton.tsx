import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  style,
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        display: 'block',
        ...style,
      }}
    />
  );
};

export const FleetCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        {/* Car Image Placeholder */}
        <Skeleton height="140px" borderRadius="14px" style={{ marginBottom: '18px' }} />

        {/* Title & Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Skeleton width="60%" height="24px" />
          <Skeleton width="20%" height="20px" borderRadius="6px" />
        </div>

        {/* Description */}
        <Skeleton height="14px" style={{ marginBottom: '8px' }} />
        <Skeleton width="85%" height="14px" style={{ marginBottom: '18px' }} />

        {/* Specs row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <Skeleton width="70px" height="20px" />
          <Skeleton width="70px" height="20px" />
          <Skeleton width="70px" height="20px" />
        </div>
      </div>

      <div>
        {/* Price row */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Skeleton width="90px" height="32px" />
          <Skeleton width="80px" height="24px" />
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Skeleton height="40px" borderRadius="10px" />
          <Skeleton height="40px" borderRadius="10px" />
        </div>
      </div>
    </div>
  );
};

export const FleetSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '24px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <FleetCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TourCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      }}
    >
      <div>
        <Skeleton height="110px" borderRadius="12px" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <Skeleton width="90px" height="16px" />
          <Skeleton width="80px" height="16px" />
        </div>
        <Skeleton width="75%" height="22px" style={{ marginBottom: '10px' }} />
        <Skeleton height="14px" style={{ marginBottom: '6px' }} />
        <Skeleton width="80%" height="14px" style={{ marginBottom: '20px' }} />
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Skeleton width="85px" height="30px" />
        <Skeleton width="110px" height="36px" borderRadius="8px" />
      </div>
    </div>
  );
};

export const ToursSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
        gap: '24px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TourCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ServiceCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      }}
    >
      <Skeleton width="56px" height="56px" borderRadius="16px" style={{ marginBottom: '20px' }} />
      <Skeleton width="70%" height="22px" style={{ marginBottom: '12px' }} />
      <Skeleton height="14px" style={{ marginBottom: '6px' }} />
      <Skeleton width="85%" height="14px" />
    </div>
  );
};

export const ServicesSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: '24px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
};
