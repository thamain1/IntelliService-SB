import { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle, XCircle, Clock, TrendingUp, Building2 } from 'lucide-react';
import { PartsOrderingService, ReorderAlert } from '../../services/PartsOrderingService';
import { supabase } from '../../lib/supabase';

interface Location {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
}

export function ReorderAlertsView() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadLocations();
    loadVendors();
    loadAlerts();
  }, [selectedLocation, selectedVendor, filterType]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const params: any = {
        locationId: selectedLocation !== 'all' ? selectedLocation : undefined,
        vendorId: selectedVendor !== 'all' ? selectedVendor : undefined,
      };

      if (filterType === 'critical') {
        params.criticalOnly = true;
      } else if (filterType === 'below_rop') {
        params.belowRopOnly = true;
      } else if (filterType === 'stockout') {
        params.stockoutsOnly = true;
      }

      const data = await PartsOrderingService.getReorderAlerts(params);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading reorder alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (alert: ReorderAlert) => {
    if (alert.isStockout) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Stockout
        </span>
      );
    }

    if (alert.belowReorderPoint) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Below ROP
        </span>
      );
    }

    if (alert.onHand <= 10) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
          <Clock className="w-3 h-3 mr-1" />
          Low
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        OK
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const criticalAlerts = alerts.filter(a => a.isStockout || a.belowReorderPoint);
  const lowStockAlerts = alerts.filter(a => !a.isStockout && !a.belowReorderPoint && a.onHand <= 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reorder Alerts</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor inventory levels and receive reorder recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {criticalAlerts.length}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {lowStockAlerts.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Locations</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {locations.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Status</option>
            <option value="stockout">Stockouts Only</option>
            <option value="below_rop">Below Reorder Point</option>
            <option value="critical">Critical (≤5)</option>
          </select>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No alerts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All inventory levels are within normal ranges for the selected filters
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Part
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Suggested Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.map((alert, idx) => (
                  <tr key={`${alert.partId}-${alert.locationId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      {getStatusBadge(alert)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.partNumber}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {alert.locationName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.locationType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        alert.onHand === 0
                          ? 'text-red-600 dark:text-red-400'
                          : alert.onHand <= alert.reorderPoint
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {alert.onHand}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {alert.reorderPoint}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {Math.ceil(alert.suggestedOrderQty)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {alert.vendorName ? (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {alert.vendorName}
                          </div>
                          {alert.leadDays > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {alert.leadDays}d lead time
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(alert.unitCost * alert.suggestedOrderQty)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
