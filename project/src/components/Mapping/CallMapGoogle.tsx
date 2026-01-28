import { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { loadGoogleMaps } from '../../lib/googleMapsLoader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Database } from '../../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: {
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    place_id: string | null;
  };
  profiles?: { full_name: string };
};

interface CallMapGoogleProps {
  statusFilter: string;
  tickets: Ticket[];
  onTicketClick?: (ticketId: string) => void;
}

export function CallMapGoogle({ statusFilter, tickets, onTicketClick }: CallMapGoogleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filtered tickets to prevent infinite loop in useEffect
  const activeTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Exclude completed, cancelled, closed tickets
      if (['completed', 'cancelled', 'closed_billed'].includes(ticket.status)) {
        return false;
      }
      // Apply status filter from dropdown
      return statusFilter === 'all' || ticket.status === statusFilter;
    });
  }, [tickets, statusFilter]);

  const ticketsWithCoords = useMemo(() => {
    return activeTickets.filter((ticket) => {
      const hasTicketCoords = ticket.latitude !== null && ticket.longitude !== null;
      const hasCustomerCoords = ticket.customers &&
        ticket.customers.latitude !== null &&
        ticket.customers.longitude !== null;
      return hasTicketCoords || hasCustomerCoords;
    });
  }, [activeTickets]);

  const ticketsWithoutCoords = useMemo(() => {
    return activeTickets.filter((ticket) => {
      const hasTicketCoords = ticket.latitude !== null && ticket.longitude !== null;
      const hasCustomerCoords = ticket.customers &&
        ticket.customers.latitude !== null &&
        ticket.customers.longitude !== null;
      return ticket.customers && !hasTicketCoords && !hasCustomerCoords;
    });
  }, [activeTickets]);

  const uniqueCustomersWithoutCoords = useMemo(() => {
    return Array.from(
      new Map(
        ticketsWithoutCoords
          .filter(t => t.customers)
          .map(t => [t.customer_id, t.customers])
      ).values()
    );
  }, [ticketsWithoutCoords]);

  useEffect(() => {
    console.log('Initializing map from useEffect');
    initializeMap();
  }, []);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [map, activeTickets]);

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.error('Map ref is not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading Google Maps API...');
      const google = await loadGoogleMaps();
      console.log('Google Maps API loaded successfully');

      const defaultCenter = { lat: 32.3547, lng: -89.3985 };

      console.log('Creating map instance...');
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 11,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      console.log('Map instance created successfully');
      setMap(newMap);
    } catch (err: any) {
      console.error('Error initializing map:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Failed to load Google Maps. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkers = async () => {
    if (!map) return;

    console.log('[Map] Updating markers...');
    console.log('[Map] Total active tickets:', activeTickets.length);
    console.log('[Map] Tickets with coords:', ticketsWithCoords.length);
    console.log('[Map] Tickets without coords:', ticketsWithoutCoords.length);

    const google = await loadGoogleMaps();

    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }

    markers.forEach((marker) => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    ticketsWithCoords.forEach((ticket) => {
      let lat = ticket.latitude;
      let lng = ticket.longitude;

      // Use customer coordinates as fallback
      if ((lat === null || lng === null) && ticket.customers) {
        lat = ticket.customers.latitude;
        lng = ticket.customers.longitude;
      }

      if (lat === null || lng === null) {
        console.warn('[Map] Skipping ticket (no coords):', ticket.ticket_number);
        return;
      }

      const position = {
        lat: parseFloat(lat.toString()),
        lng: parseFloat(lng.toString()),
      };

      console.log('[Map] Adding marker for ticket:', ticket.ticket_number, 'at position:', position, 'status:', ticket.status, 'priority:', ticket.priority);

      const statusColors: Record<string, string> = {
        open: '#ef4444',
        scheduled: '#3b82f6',
        in_progress: '#eab308',
        completed: '#22c55e',
        closed_billed: '#10b981',
      };

      const color = statusColors[ticket.status] || '#6b7280';

      const priorityScales: Record<string, number> = {
        urgent: 1.5,
        high: 1.2,
        normal: 1.0,
        low: 0.8,
      };

      const scale = priorityScales[ticket.priority] || 1.0;

      try {
        // Use simple colored circles - most reliable approach
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${ticket.ticket_number} - ${ticket.title}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8 * scale,
          },
          zIndex: ticket.priority === 'urgent' ? 1000 : ticket.priority === 'high' ? 900 : 800,
          optimized: false,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(ticket),
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        bounds.extend(position);

        console.log('[Map] Successfully created marker #', newMarkers.length, 'for', ticket.ticket_number);
      } catch (markerError) {
        console.error('[Map] Error creating marker for', ticket.ticket_number, ':', markerError);
      }
    });

    setMarkers(newMarkers);

    console.log('[Map] Created', newMarkers.length, 'markers');
    console.log('[Map] Markers state updated');

    if (newMarkers.length > 0) {
      console.log('[Map] Fitting bounds for', newMarkers.length, 'markers');

      if (newMarkers.length === 1) {
        const center = newMarkers[0].getPosition();
        console.log('[Map] Single marker - centering at:', center?.toJSON());
        map.setCenter(center!);
        map.setZoom(14);
      } else {
        console.log('[Map] Multiple markers - fitting bounds:', bounds.toJSON());
        map.fitBounds(bounds);
      }

      if (newMarkers.length > 50) {
        console.log('[Map] Creating marker clusterer for', newMarkers.length, 'markers');
        const clusterer = new MarkerClusterer({ map, markers: newMarkers });
        setMarkerClusterer(clusterer);
      }
    } else {
      console.warn('[Map] ❌ No markers to display - check if tickets have coordinates');
    }
  };

  const createInfoWindowContent = (ticket: Ticket): string => {
    const statusLabels: Record<string, string> = {
      open: 'Open',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      closed_billed: 'Closed & Billed',
    };

    const statusColors: Record<string, string> = {
      open: '#ef4444',
      scheduled: '#3b82f6',
      in_progress: '#eab308',
      completed: '#22c55e',
      closed_billed: '#10b981',
    };

    const statusLabel = statusLabels[ticket.status] || ticket.status;
    const statusColor = statusColors[ticket.status] || '#6b7280';

    return `
      <div style="padding: 12px; min-width: 250px; max-width: 350px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            ${ticket.ticket_number}
          </h3>
          <span style="
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            background-color: ${statusColor}20;
            color: ${statusColor};
          ">
            ${statusLabel}
          </span>
        </div>
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #374151;">
            ${ticket.title}
          </p>
          ${ticket.description ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">${ticket.description}</p>` : ''}
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
          <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
            <strong>Customer:</strong> ${ticket.customers?.name || 'N/A'}
          </p>
          ${ticket.customers?.address ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Address:</strong> ${ticket.customers.address}, ${ticket.customers.city}, ${ticket.customers.state}
            </p>
          ` : ''}
          ${ticket.profiles ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Technician:</strong> ${ticket.profiles.full_name}
            </p>
          ` : ''}
          ${ticket.scheduled_date ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Scheduled:</strong> ${new Date(ticket.scheduled_date).toLocaleString()}
            </p>
          ` : ''}
        </div>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <button
            onclick="window.dispatchEvent(new CustomEvent('viewTicket', { detail: '${ticket.id}' }))"
            style="
              width: 100%;
              padding: 8px 16px;
              background-color: #3b82f6;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            View Ticket Details
          </button>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-4">
      {uniqueCustomersWithoutCoords.length > 0 && !loading && !error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {ticketsWithoutCoords.length} ticket{ticketsWithoutCoords.length !== 1 ? 's' : ''} from {uniqueCustomersWithoutCoords.length} customer{uniqueCustomersWithoutCoords.length !== 1 ? 's' : ''}{' '}
                  missing coordinates
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  These tickets cannot be displayed on the map. Add latitude and longitude coordinates to customer records to show them.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-[600px] rounded-lg border-2 border-gray-300 dark:border-gray-700"
        ></div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load map</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && ticketsWithCoords.length === 0 && activeTickets.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-lg pointer-events-none">
            <div className="text-center max-w-md p-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                No Location Data Available
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {activeTickets.length} ticket{activeTickets.length !== 1 ? 's' : ''} loaded but {activeTickets.length !== 1 ? 'none have' : 'it has no'} geocoded coordinates.
                Add latitude/longitude to customer records to display markers.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span>
            Showing {ticketsWithCoords.length} of {activeTickets.length} active tickets
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Open</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
