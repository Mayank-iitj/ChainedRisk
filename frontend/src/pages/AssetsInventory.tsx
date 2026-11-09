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
  Cpu,
  X
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
      setAssets(data || []);
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
    <div className="space-y-6 pb-8 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
            <span className="text-white font-semibold">ATTACK SURFACE</span> // PERIMETER INVENTORY
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <Server className="w-5 h-5 text-white" />
            <span>Asset Inventory & Network Zones</span>
            <span className="bg-white text-black text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ml-1">
              {assets.length} Assets
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            DMZ endpoints, internal pivot nodes, and high-value crown jewel datastores mapped into the correlation graph.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-mono font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD PERIMETER ASSET</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Zone:</span>
          {(['all', 'dmz', 'internal', 'lab', 'external'] as const).map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1 rounded-lg uppercase text-[10px] transition cursor-pointer ${
                selectedZone === z
                  ? 'bg-white text-black font-bold'
                  : 'bg-black hover:text-white text-neutral-400 border border-[#262626]'
              }`}
            >
              {z === 'all' ? 'All Zones' : z.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, IP, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-[#262626] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white text-xs font-mono"
          />
        </div>
      </div>

      {/* Assets Grid / Table */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-3 font-mono">
            <Server className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold text-white uppercase">No perimeter assets found</h3>
            <p className="text-xs max-w-sm mx-auto text-neutral-400 font-sans">
              No assets matched the current zone filter. Add a new target asset or ingest network scan results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-black text-neutral-400 text-[10px] uppercase tracking-wider border-b border-[#262626]">
                  <th className="py-3 px-4">ASSET IDENTITY</th>
                  <th className="py-3 px-3">ZONE</th>
                  <th className="py-3 px-3">TYPE</th>
                  <th className="py-3 px-3">IP ADDRESS</th>
                  <th className="py-3 px-3">SERVICES & TECH</th>
                  <th className="py-3 px-3">DATASTORES</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredAssets.map((asset) => {
                  const services = asset.props?.services || [];
                  const isJewel = (asset.props?.datastores && asset.props.datastores.length > 0) || asset.zone === 'internal';
                  return (
                    <tr key={asset.id} className="hover:bg-white/[0.03] transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-black border border-white text-white">
                            {asset.zone === 'dmz' ? <Globe className="w-4 h-4" /> : isJewel ? <Database className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-xs flex items-center gap-1.5 font-mono">
                              <span>{asset.name}</span>
                              {isJewel && (
                                <span className="bg-white text-black text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  CROWN JEWEL
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono">{asset.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          asset.zone === 'dmz'
                            ? 'bg-white text-black font-bold'
                            : asset.zone === 'internal'
                            ? 'border-2 border-white text-white bg-black'
                            : 'bg-black text-neutral-300 border border-[#262626]'
                        }`}>
                          {asset.zone}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-neutral-300">
                        {asset.type}
                      </td>

                      <td className="py-3.5 px-3 text-white text-xs">
                        {asset.props?.ip || '10.77.0.x'}
                      </td>

                      <td className="py-3.5 px-3">
                        {services.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {services.map((s: any, idx: number) => (
                              <span key={idx} className="bg-black text-neutral-300 text-[10px] px-2 py-0.5 rounded border border-[#262626]">
                                :{s.port || 80} ({s.product || 'tcp'})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-600 text-[11px] italic">No open ports</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-[11px] text-neutral-400">
                        {asset.props?.datastores && asset.props.datastores.length > 0 ? (
                          <span className="text-white font-semibold">{asset.props.datastores.join(', ')}</span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onSelectFindingQuery && (
                            <button
                              onClick={() => onSelectFindingQuery(asset.id)}
                              title="View Findings for Asset"
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            title="Remove Asset"
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-white font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase">
                <Plus className="w-4 h-4 text-white" />
                <span>Register Perimeter Asset</span>
              </h3>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-black border border-white text-white text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase text-[10px]">Asset Hostname *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. auth-db.internal"
                    className="w-full px-3 py-2 bg-black border border-[#262626] rounded-xl text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase text-[10px]">Asset Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-[#262626] rounded-xl text-white focus:outline-none focus:border-white"
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
                  <label className="block text-neutral-400 mb-1 uppercase text-[10px]">Network Zone</label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-[#262626] rounded-xl text-white focus:outline-none focus:border-white"
                  >
                    <option value="dmz">DMZ (Public-Facing)</option>
                    <option value="internal">Internal Core (Isolated)</option>
                    <option value="lab">Lab Staging</option>
                    <option value="cloud">Cloud VPC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase text-[10px]">IP Address</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="10.77.0.x"
                    className="w-full px-3 py-2 bg-black border border-[#262626] rounded-xl text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase text-[10px]">Exposed Port</label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    placeholder="5432, 6379, 80"
                    className="w-full px-3 py-2 bg-black border border-[#262626] rounded-xl text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase text-[10px]">Technology / Banner</label>
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="PostgreSQL 15, Redis 7"
                    className="w-full px-3 py-2 bg-black border border-[#262626] rounded-xl text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-black border border-[#262626] rounded-xl flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="crownJewelCheck"
                  checked={isCrownJewel}
                  onChange={(e) => setIsCrownJewel(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-black accent-white cursor-pointer"
                />
                <label htmlFor="crownJewelCheck" className="text-white font-semibold cursor-pointer text-xs">
                  Tag as Crown Jewel (Target requiring HITL blast radius containment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl cursor-pointer disabled:opacity-50"
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
