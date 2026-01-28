import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Search, Calendar, MapPin, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type WarrantyRecord = {
  id: string;
  serial_number: string;
  part_name: string;
  part_number: string;
  warranty_status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'MISSING_DATES';
  warranty_type: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  duration_months: number | null;
  vendor_name: string | null;
  warranty_provider: string | null;
  customer_name: string | null;
  location_name: string | null;
  equipment_type: string | null;
  stock_location_name: string | null;
  serialized_part_status: string;
};

type WarrantyStatus = 'active' | 'expired' | 'expiring_soon' | 'missing_dates';

export function WarrantyDashboard() {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_warranty_tracking')
        .select('*')
        .order('end_date', { ascending: true });

      if (error) throw error;
      setWarranties(data || []);
    } catch (error) {
      console.error('Error loading warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyStatus = (warranty: WarrantyRecord): WarrantyStatus => {
    // Map database warranty_status to UI status
    return warranty.warranty_status.toLowerCase() as WarrantyStatus;
  };

  const getDaysRemaining = (warranty: WarrantyRecord) => {
    return warranty.days_remaining;
  };

  const filteredWarranties = warranties.filter((warranty) => {
    const matchesSearch =
      warranty.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getWarrantyStatus(warranty);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: warranties.length,
    active: warranties.filter((w) => getWarrantyStatus(w) === 'active').length,
    expiring_soon: warranties.filter((w) => getWarrantyStatus(w) === 'expiring_soon').length,
    expired: warranties.filter((w) => getWarrantyStatus(w) === 'expired').length,
    missing_dates: warranties.filter((w) => getWarrantyStatus(w) === 'missing_dates').length,
  };

  const getStatusColor = (status: WarrantyStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'missing_dates':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Warranty Tracking</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor warranty status and expiration dates
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: 'all', label: 'All Warranties', count: statusCounts.all, icon: Shield },
          {
            id: 'active',
            label: 'Active',
            count: statusCounts.active,
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            id: 'expiring_soon',
            label: 'Expiring Soon',
            count: statusCounts.expiring_soon,
            icon: AlertTriangle,
            color: 'text-yellow-600 dark:text-yellow-400',
          },
          {
            id: 'expired',
            label: 'Expired',
            count: statusCounts.expired,
            icon: Clock,
            color: 'text-gray-600 dark:text-gray-400',
          },
          {
            id: 'missing_dates',
            label: 'Missing Dates',
            count: statusCounts.missing_dates,
            icon: AlertTriangle,
            color: 'text-orange-600 dark:text-orange-400',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              onClick={() => setStatusFilter(stat.id)}
              className={`card p-4 text-left transition-all ${
                statusFilter === stat.id
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.count}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon className={`w-6 h-6 ${stat.color || 'text-blue-600 dark:text-blue-400'}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by serial number, part name, customer, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Part
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWarranties.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm || statusFilter !== 'all'
                      ? 'No warranties match your filters'
                      : 'No warranty records yet'}
                  </td>
                </tr>
              ) : (
                filteredWarranties.map((warranty) => {
                  const status = getWarrantyStatus(warranty);
                  const daysRemaining = getDaysRemaining(warranty);
                  const isExpiringSoon = status === 'expiring_soon';

                  return (
                    <tr
                      key={warranty.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isExpiringSoon ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {warranty.serial_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {warranty.part_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {warranty.part_number}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {warranty.customer_name ? (
                          <div>
                            <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-white">
                              <MapPin className="w-3 h-3" />
                              <span>{warranty.customer_name}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {warranty.location_name || 'No location'}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            <Package className="w-3 h-3" />
                            <span>{warranty.stock_location_name || 'In stock'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            status
                          )}`}
                        >
                          {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {warranty.warranty_provider || warranty.vendor_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(warranty.start_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(warranty.end_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {status === 'active' || isExpiringSoon ? (
                          <div
                            className={`flex items-center space-x-1 ${
                              isExpiringSoon
                                ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            <span>{daysRemaining} days</span>
                            {isExpiringSoon && <AlertTriangle className="w-4 h-4 ml-1" />}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {statusCounts.expiring_soon > 0 && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Warranties Expiring Soon
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                {statusCounts.expiring_soon} {statusCounts.expiring_soon === 1 ? 'warranty expires' : 'warranties expire'} within the next 30 days. Review coverage options and consider renewing or replacing parts.
              </p>
            </div>
          </div>
        </div>
      )}

      {statusCounts.missing_dates > 0 && (
        <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Missing Warranty Information
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                {statusCounts.missing_dates} {statusCounts.missing_dates === 1 ? 'part has' : 'parts have'} incomplete warranty dates. Update warranty information to ensure proper tracking.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
