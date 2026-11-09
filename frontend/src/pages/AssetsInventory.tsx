import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Layers,
  Database,
  Globe,
  Radio,
  Cpu
} from 'lucide-react';
import { AssetItem } from '../types';
import { fetchAssets, createAsset, deleteAsset } from '../api';

interface AssetsInventoryProps {
  projectId: string;
  onSelectFindingQuery?: (query: string) => void;
}

export const AssetsInventory: React.FC<AssetsInventoryProps> = ({
  projectId,
  onSelectFindingQuery
}) => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Asset Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Host');
  const [newZone, setNewZone] = useState('internal');
  const [newIp, setNewIp] = useState('10.77.0.');
  const [newPort, setNewPort] = useState('8080');
  const [newTech, setNewTech] = useState('');
  const [isCrownJewel, setIsCrownJewel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, [projectId, selectedZone]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const zoneParam = selectedZone === 'all' ? undefined : selectedZone;
      const data = await fetchAssets(projectId, zoneParam);
      setAssets(data);
    } catch (err: any) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      setError('Please provide an asset name');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const services = newPort ? [{ port: parseInt(newPort, 10) || 80, product: newTech || 'Service' }] : [];
      const datastores = isCrownJewel ? [newName] : [];
      await createAsset(projectId, {
        name: newName,
        type: newType,
        zone: newZone,
        ip: newIp,
        services,
        datastores,
        tags: isCrownJewel ? ['crown_jewel', 'high_value'] : ['perimeter_node']
      });
      setShowAddModal(false);
      resetForm();
      loadAssets();
    } catch (err: any) {
      setError(err.message || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    if (!window.confirm(`Are you sure you want to remove asset "${assetName}" from inventory?`)) return;
    try {
      await deleteAsset(projectId, assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewType('Host');
    setNewZone('internal');
    setNewIp('10.77.0.');
    setNewPort('8080');
    setNewTech('');
    setIsCrownJewel(false);
    setError(null);
  };

  const filteredAssets = assets.filter((a) => {
    if (selectedZone !== 'all' && a.zone !== selectedZone) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const ip = a.props?.ip || '';
      return a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || ip.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#64748b]">
            <span className="text-[#6366f1] font-bold">Attack Surface</span> / Perimeter Inventory
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#6366f1]" />
            <span>Asset Inventory & Network Zones</span>
            <span className="bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe] text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ml-1">
              {assets.length} Assets
            </span>
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            DMZ endpoints, internal pivot nodes, and high-value crown jewel datastores mapped into the correlation graph.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-[#6366f1]/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ADD PERIMETER ASSET</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="reveal-block bg-white border border-[#eef2f6] rounded-2xl p-4 shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Zone:</span>
          {(['all', 'dmz', 'internal', 'lab', 'external'] as const).map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition cursor-pointer text-xs ${
                selectedZone === z
                  ? 'bg-[#6366f1] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {z === 'all' ? 'All Zones' : z.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset name, IP, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Assets Grid / Table */}
      <div className="reveal-block bg-white border border-[#eef2f6] rounded-2xl shadow-card overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="p-12 text-center text-[#64748b] space-y-3">
            <Server className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No perimeter assets found</h3>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              No assets matched the current zone filter. Add a new target asset or ingest network scan results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-[11px] font-semibold border-b border-[#eef2f6]">
                  <th className="py-3 px-4">ASSET IDENTITY</th>
                  <th className="py-3 px-3">ZONE</th>
                  <th className="py-3 px-3">TYPE</th>
                  <th className="py-3 px-3">IP ADDRESS</th>
                  <th className="py-3 px-3">SERVICES & TECH</th>
                  <th className="py-3 px-3">DATASTORES</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {filteredAssets.map((asset) => {
                  const services = asset.props?.services || [];
                  const isJewel = (asset.props?.datastores && asset.props.datastores.length > 0) || asset.zone === 'internal';
                  return (
                    <tr key={asset.id} className="hover:bg-[#f8fafc] transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            asset.zone === 'dmz'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : isJewel
                              ? 'bg-purple-50 text-purple-600 border border-purple-200'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          }`}>
                            {asset.zone === 'dmz' ? <Globe className="w-4 h-4" /> : isJewel ? <Database className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-[#0f172a] text-xs flex items-center gap-1.5">
                              <span>{asset.name}</span>
                              {isJewel && (
                                <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  CROWN JEWEL
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{asset.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          asset.zone === 'dmz'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : asset.zone === 'internal'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {asset.zone}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {asset.type}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-600 text-xs">
                        {asset.props?.ip || '10.77.0.x'}
                      </td>

                      <td className="py-3.5 px-3">
                        {services.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {services.map((s: any, idx: number) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200">
                                :{s.port || 80} ({s.product || 'tcp'})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No active ports</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {asset.props?.datastores && asset.props.datastores.length > 0 ? (
                          <span className="text-purple-700 font-semibold">{asset.props.datastores.join(', ')}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onSelectFindingQuery && (
                            <button
                              onClick={() => onSelectFindingQuery(asset.id)}
                              title="View Findings for Asset"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            title="Remove Asset"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Perimeter Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Register New Perimeter Asset</span>
              </h3>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asset Name / Hostname *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. auth-db.internal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asset Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Host">Host / Virtual Machine</option>
                    <option value="Container">Docker Container</option>
                    <option value="DataStore">DataStore / Database</option>
                    <option value="Service">Microservice API</option>
                    <option value="Router">Gateway / Router</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Network Zone</label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="dmz">DMZ (Public-Facing)</option>
                    <option value="internal">Internal Core (Isolated)</option>
                    <option value="lab">Lab Staging</option>
                    <option value="cloud">Cloud VPC</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Address</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="10.77.0.x"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exposed Port</label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    placeholder="e.g. 5432, 6379, 80"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Technology / Banner</label>
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="e.g. PostgreSQL 15, Redis 7"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="crownJewelCheck"
                  checked={isCrownJewel}
                  onChange={(e) => setIsCrownJewel(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="crownJewelCheck" className="text-purple-900 font-semibold cursor-pointer">
                  Tag as Crown Jewel (Breach target requiring HITL blast radius containment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Registering...' : 'Add to Perimeter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
