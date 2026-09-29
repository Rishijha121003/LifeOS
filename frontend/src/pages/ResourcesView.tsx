import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Resource } from '../types/resource';
import { fetchResources } from '../api/resources';

export const ResourcesView: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchResources()
      .then((data) => {
        if (isMounted) {
          setResources(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching resources:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bento-card">
      <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
        Student Developer Resources
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', marginBottom: '16px' }}>
        Curated roadmaps, interview prep platforms, and system design links.
      </p>

      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
          Loading resources...
        </div>
      ) : (
        <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {resources.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
              title={`Open ${item.title} (${item.url}) in a new tab`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <h4 className="resource-card-title" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {item.title}
                </h4>
                <ExternalLink size={14} className="resource-card-icon" style={{ color: '#94A3B8', flexShrink: 0, marginTop: '2px', transition: 'color 0.15s ease, transform 0.15s ease' }} />
              </div>
              {item.description && (
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', marginBottom: 0, lineHeight: 1.4 }}>
                  {item.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
