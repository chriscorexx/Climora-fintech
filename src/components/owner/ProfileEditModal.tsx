import React, { useState } from 'react';
import { MSMEProfile, IndustryType } from '../../types';
import { geocodeCity } from '../../core/weatherService';
import { normalizeProfile } from '../../core/profileUtils';
import { X, MapPin, Check, Loader2 } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: MSMEProfile) => void;
  initialProfile?: MSMEProfile;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}) => {
  if (!isOpen) return null;

  const safeInitial = initialProfile ? normalizeProfile(initialProfile) : undefined;

  const [name, setName] = useState(safeInitial?.name || '');
  const [udyam, setUdyam] = useState(safeInitial?.udyamNumber || '');
  const [industry, setIndustry] = useState<IndustryType>(safeInitial?.industry || 'food_processing');
  const [businessSize, setBusinessSize] = useState<'micro' | 'small' | 'medium'>(safeInitial?.businessSize || 'small');
  
  // Location
  const [city, setCity] = useState(safeInitial?.location.city || 'Pune');
  const [state, setState] = useState(safeInitial?.location.state || 'Maharashtra');
  const [lat, setLat] = useState(safeInitial?.location.latitude || 18.5204);
  const [lng, setLng] = useState(safeInitial?.location.longitude || 73.8567);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState('');

  // Financials
  const [monthlyRevenue, setMonthlyRevenue] = useState(safeInitial?.financials.monthlyRevenue || 1500000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(safeInitial?.financials.monthlyOperatingExpenses || 1100000);
  const [monthlyDebt, setMonthlyDebt] = useState(safeInitial?.financials.existingMonthlyDebtObligations || 120000);
  const [cashReserves, setCashReserves] = useState(safeInitial?.financials.availableCashReserves || 800000);
  const [requestedLoan, setRequestedLoan] = useState(safeInitial?.financials.requestedLoanAmount || 2500000);

  // Operations
  const [plinthHeight, setPlinthHeight] = useState(safeInitial?.operations.plinthHeightMeters ?? 0.4);
  const [hasFloodBarriers, setHasFloodBarriers] = useState(safeInitial?.operations.hasFloodBarriers ?? false);
  const [hasBackupGen, setHasBackupGen] = useState(safeInitial?.operations.hasBackupGenerator ?? false);
  const [hasColdStorage, setHasColdStorage] = useState(safeInitial?.operations.hasColdStorage ?? false);
  const [hasWaterStorage, setHasWaterStorage] = useState(safeInitial?.operations.hasWaterStorageRainwater ?? false);
  const [hasInsurance, setHasInsurance] = useState(safeInitial?.operations.hasClimateInsurance ?? false);

  const handleGeocode = async () => {
    setIsGeocoding(true);
    setGeocodeMsg('');
    const res = await geocodeCity(city);
    setIsGeocoding(false);
    if (res) {
      setLat(Math.round(res.latitude * 10000) / 10000);
      setLng(Math.round(res.longitude * 10000) / 10000);
      setGeocodeMsg(`Coordinates resolved: ${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`);
    } else {
      setGeocodeMsg('City coordinates not found; using existing values.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MSMEProfile = {
      id: initialProfile?.id || `msme_${Date.now()}`,
      name: name || 'Enterprise Profile',
      udyamNumber: udyam || undefined,
      industry,
      businessSize,
      businessStage: initialProfile?.businessStage || 'growth',
      employeeCount: initialProfile?.employeeCount || 15,
      location: {
        city,
        state,
        country: 'India',
        latitude: lat,
        longitude: lng,
        address: `${city}, ${state}`,
      },
      financials: {
        monthlyRevenue: Number(monthlyRevenue),
        monthlyOperatingExpenses: Number(monthlyExpenses),
        existingMonthlyDebtObligations: Number(monthlyDebt),
        availableCashReserves: Number(cashReserves),
        requestedLoanAmount: Number(requestedLoan),
        loanTenureMonths: 36,
        annualTurnover: Number(monthlyRevenue) * 12,
      },
      operations: {
        electricityGridDependent: true,
        hasBackupGenerator: hasBackupGen,
        waterIntensive: industry === 'food_processing' || industry === 'textile_garments',
        hasWaterStorageRainwater: hasWaterStorage,
        perishableInventory: industry === 'food_processing' || industry === 'agriculture_allied',
        hasColdStorage: hasColdStorage,
        transportSupplyChainSensitive: true,
        plinthHeightMeters: Number(plinthHeight),
        hasFloodBarriers,
        hasClimateInsurance: hasInsurance,
      },
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-fin-card border border-fin-border shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-fin-border">
          <div>
            <h2 className="text-base font-bold text-fin-text tracking-tight">
              {initialProfile ? 'Edit MSME Profile & Resilience Setup' : 'Register New MSME Enterprise'}
            </h2>
            <p className="text-xs text-fin-muted">Update business financials and climate mitigation features.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-fin-muted hover:text-fin-text hover:bg-fin-inset transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Section 1: Enterprise Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-fin-secondary font-medium block mb-1">Enterprise Trade Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sahyadri Agro Processors"
                className="w-full px-3 py-2 rounded-lg bg-fin-inset border border-fin-border text-fin-text focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-fin-secondary font-medium block mb-1">Udyam Registration Number</label>
              <input
                type="text"
                value={udyam}
                onChange={(e) => setUdyam(e.target.value)}
                placeholder="UDYAM-MH-26-0045129"
                className="w-full px-3 py-2 rounded-lg bg-fin-inset border border-fin-border text-fin-text font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-fin-secondary font-medium block mb-1">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as IndustryType)}
                className="w-full px-3 py-2 rounded-lg bg-fin-inset border border-fin-border text-fin-text focus:outline-none focus:border-emerald-500"
              >
                <option value="food_processing">Food Processing & Cold Chain</option>
                <option value="textile_garments">Textile & Garments Weaving</option>
                <option value="light_manufacturing">Light Engineering & Auto Components</option>
                <option value="agriculture_allied">Agriculture & Allied Feeds</option>
                <option value="chemicals_plastics">Chemicals & Polymers</option>
                <option value="logistics_warehousing">Logistics & Warehousing</option>
                <option value="retail_grocery">Retail & Wholesale Distribution</option>
                <option value="automotive_repair">Automotive Fabrication & Repair</option>
              </select>
            </div>
            <div>
              <label className="text-fin-secondary font-medium block mb-1">Enterprise Size</label>
              <select
                value={businessSize}
                onChange={(e) => setBusinessSize(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-fin-inset border border-fin-border text-fin-text focus:outline-none focus:border-emerald-500"
              >
                <option value="micro">Micro (Turnover &lt; ₹5 Cr)</option>
                <option value="small">Small (Turnover ₹5 Cr - ₹50 Cr)</option>
                <option value="medium">Medium (Turnover ₹50 Cr - ₹250 Cr)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Location & Geocoding */}
          <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border space-y-3">
            <div className="text-[11px] font-mono uppercase text-fin-muted">Location & Geocoding Coordinates</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-fin-muted block mb-1">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-fin-muted block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="w-full py-1.5 px-3 rounded-lg bg-fin-inset hover:bg-fin-sunken text-fin-text font-medium flex items-center justify-center gap-1.5 transition-colors border border-fin-border"
                >
                  {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" /> : <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  <span>Geocode Location</span>
                </button>
              </div>
            </div>
            {geocodeMsg && <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">{geocodeMsg}</div>}
          </div>

          {/* Section 3: Monthly Financial Indicators */}
          <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border space-y-3">
            <div className="text-[11px] font-mono uppercase text-fin-muted">Monthly Financial Indicators (₹ INR)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-fin-muted block mb-1">Monthly Revenue (₹)</label>
                <input
                  type="number"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text font-mono"
                />
              </div>
              <div>
                <label className="text-fin-muted block mb-1">Operating Expenses (₹)</label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text font-mono"
                />
              </div>
              <div>
                <label className="text-fin-muted block mb-1">Monthly Debt Service (₹)</label>
                <input
                  type="number"
                  value={monthlyDebt}
                  onChange={(e) => setMonthlyDebt(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-fin-muted block mb-1">Available Cash Reserves (₹)</label>
                <input
                  type="number"
                  value={cashReserves}
                  onChange={(e) => setCashReserves(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text font-mono"
                />
              </div>
              <div>
                <label className="text-fin-muted block mb-1">Requested Facility Amount (₹)</label>
                <input
                  type="number"
                  value={requestedLoan}
                  onChange={(e) => setRequestedLoan(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-fin-text font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Physical & Operational Resilience Features */}
          <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border space-y-3">
            <div className="text-[11px] font-mono uppercase text-fin-muted">Physical Resilience & Climate Mitigations</div>
            <div>
              <label className="text-fin-muted block mb-1">
                Plinth Elevation Above Street Level: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{plinthHeight}m</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.1"
                value={plinthHeight}
                onChange={(e) => setPlinthHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-fin-inset rounded-lg appearance-none accent-emerald-500 cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFloodBarriers}
                  onChange={(e) => setHasFloodBarriers(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-fin-secondary">Flood Barriers</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBackupGen}
                  onChange={(e) => setHasBackupGen(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-fin-secondary">Backup Generator</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasColdStorage}
                  onChange={(e) => setHasColdStorage(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-fin-secondary">Cold Storage</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWaterStorage}
                  onChange={(e) => setHasWaterStorage(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-fin-secondary">Rainwater Storage</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasInsurance}
                  onChange={(e) => setHasInsurance(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-fin-secondary">Climate Insurance</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-fin-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-fin-inset hover:bg-fin-sunken text-fin-secondary font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save & Recalculate Assessment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
