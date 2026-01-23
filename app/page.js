'use client';

import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Info } from 'lucide-react';

export default function Home() {
  const [country, setCountry] = useState('EE');
  const [baseSalary, setBaseSalary] = useState('2000');
  const [bonus, setBonus] = useState('');
  const [bonusFreq, setBonusFreq] = useState('annual');
  
  const [benefits, setBenefits] = useState({
    car: false, carValue: '25000',
    meal: false, mealAmount: '4',
    health: false, healthAmount: '100',
    phone: false, phoneAmount: '50',
    coffee: false,
    training: false, trainingAmount: '1000',
    extraDays: false, daysAmount: '5'
  });
  
  const [customBenefits, setCustomBenefits] = useState([]);
  const [nextId, setNextId] = useState(1);

  const countries = { EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania' };
  const workDays = 20;

  const updateBenefit = (key, value) => setBenefits({ ...benefits, [key]: value });

  const addCustomBenefit = () => {
    setCustomBenefits([...customBenefits, { id: nextId, name: 'Custom Benefit', value: '0', frequency: 'monthly' }]);
    setNextId(nextId + 1);
  };

  const removeCustomBenefit = (id) => setCustomBenefits(customBenefits.filter(b => b.id !== id));
  
  const updateCustomBenefit = (id, field, value) => {
    setCustomBenefits(customBenefits.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Country-specific tax rules
  const getCountryRules = () => {
    switch(country) {
      case 'EE':
        return {
          healthTaxFreeAnnual: 400,
          healthTaxFreeMonthly: 33.33,
          carTaxable: true,
          carTaxRate: 0.705,
          mealTaxable: true,
          fringeBenefitTax: 0.705
        };
      case 'LV':
        return {
          healthTaxFreeAnnual: 0,
          healthTaxFreeMonthly: 0,
          carTaxable: true,
          carTaxRate: 0.50,
          mealTaxable: true,
          fringeBenefitTax: 0.50
        };
      case 'LT':
        return {
          healthTaxFreeAnnual: 0,
          healthTaxFreeMonthly: 0,
          carTaxable: true,
          carTaxRate: 0.40,
          mealTaxable: true,
          fringeBenefitTax: 0.40
        };
    }
  };

  const rules = getCountryRules();

  // Calculations
  const salary = parseFloat(baseSalary) || 0;
  const bonusAmt = parseFloat(bonus) || 0;
  const annualSalary = salary * 12;
  const annualBonus = bonusFreq === 'monthly' ? bonusAmt * 12 : bonusFreq === 'quarterly' ? bonusAmt * 4 : bonusAmt;

  // Car
  let carBIK = 0;
  let carUsage = 0;
  let carTaxCost = 0;
  
  if (benefits.car) {
    const carValue = parseFloat(benefits.carValue) || 0;
    if (country === 'EE') {
      carBIK = carValue * 0.012;
      carUsage = carValue * 0.03;
      carTaxCost = carBIK * rules.carTaxRate;
    } else {
      carBIK = carValue * 0.015;
      carTaxCost = carBIK * rules.carTaxRate;
    }
  }

  // Meal vouchers
  const mealValue = benefits.meal ? (parseFloat(benefits.mealAmount) || 0) * workDays : 0;
  let mealTaxCost = 0;
  if (benefits.meal && rules.mealTaxable) {
    mealTaxCost = mealValue * (country === 'EE' ? rules.fringeBenefitTax : 0.20);
  }

  // Health
  const healthValue = benefits.health ? (parseFloat(benefits.healthAmount) || 0) : 0;
  const healthTaxFree = Math.min(healthValue, rules.healthTaxFreeMonthly);
  const healthTaxable = Math.max(0, healthValue - healthTaxFree);
  const healthTaxCost = healthTaxable * (country === 'EE' ? rules.fringeBenefitTax : 0.20);

  // Phone
  const phoneValue = benefits.phone ? (parseFloat(benefits.phoneAmount) || 0) : 0;
  const phoneTaxCost = phoneValue * (country === 'EE' ? rules.fringeBenefitTax : 0.20);

  // Coffee
  const coffeeValue = benefits.coffee ? workDays : 0;

  // Training
  const trainingValue = benefits.training ? (parseFloat(benefits.trainingAmount) || 0) : 0;

  // Extra days
  const dailySalary = salary / workDays;
  const daysValue = benefits.extraDays ? dailySalary * (parseFloat(benefits.daysAmount) || 0) : 0;

  // Custom
  const customMonthly = customBenefits.filter(b => b.frequency === 'monthly').reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
  const customAnnual = customBenefits.filter(b => b.frequency === 'annual').reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);

  // Totals
  const monthlyBenefitsGross = carBIK + mealValue + healthValue + phoneValue + coffeeValue + customMonthly;
  const annualBenefitsGross = monthlyBenefitsGross * 12 + trainingValue + daysValue + customAnnual;
  
  const monthlyTaxCost = carTaxCost + mealTaxCost + healthTaxCost + phoneTaxCost;
  const annualTaxCost = monthlyTaxCost * 12;

  const totalAnnualComp = annualSalary + annualBonus + annualBenefitsGross;
  const totalMonthlyComp = totalAnnualComp / 12;
  const totalAnnualBenefits = annualBenefitsGross;
  const additionalValue = carUsage * 12;

  const BenefitToggle = ({ label, checked, onChange, children, info }) => (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 text-red-600 focus:ring-red-500 rounded" />
          <label className="font-medium text-slate-800 cursor-pointer" onClick={() => onChange(!checked)}>{label}</label>
        </div>
        {info && (
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-400 cursor-help" />
            <div className="absolute right-0 top-6 w-64 bg-slate-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{info}</div>
          </div>
        )}
      </div>
      {checked && <div className="pl-7">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-10">
          <div className="mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-7 h-7 text-red-600" />
              <h1 className="text-3xl font-light text-slate-800">Total Compensation Calculator</h1>
            </div>
            <p className="text-slate-600 text-sm">
              Calculate your true total compensation including all benefits for {countries[country]}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full md:w-64 px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="EE">🇪🇪 Estonia</option>
                  <option value="LV">🇱🇻 Latvia</option>
                  <option value="LT">🇱🇹 Lithuania</option>
                </select>
              </div>

              {/* Base Compensation */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Base Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Monthly Gross Salary (€)
                    </label>
                    <input
                      type="number"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      placeholder="2000"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bonus Amount (€)</label>
                    <input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bonus Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['monthly', 'quarterly', 'annual'].map(f => (
                      <button key={f} onClick={() => setBonusFreq(f)} className={`px-4 py-2 rounded text-sm font-medium transition-all ${bonusFreq === f ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4">Benefits</h3>
                <div className="space-y-3">
                  <BenefitToggle 
                    label="Company Car" 
                    checked={benefits.car} 
                    onChange={(v) => updateBenefit('car', v)} 
                    info={country === 'EE' 
                      ? "Estonia: Employer pays ~70.5% tax on benefit-in-kind (1.2% of car value monthly). Usage value (~3% monthly) is additional non-taxed benefit."
                      : `${countries[country]}: Company car provided as fringe benefit. Subject to taxation as employment income.`
                    }
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Car Market Value (€)</label>
                      <input type="number" value={benefits.carValue} onChange={(e) => updateBenefit('carValue', e.target.value)} placeholder="25000" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      {country === 'EE' && (
                        <p className="text-xs text-slate-500 mt-1">Benefit-in-kind: 1.2% monthly (taxed at ~70.5%) | Usage value: 3% monthly (not taxed)</p>
                      )}
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Meal Vouchers / Lunch Benefit" 
                    checked={benefits.meal} 
                    onChange={(v) => updateBenefit('meal', v)} 
                    info={country === 'EE'
                      ? "Estonia: Generally taxed as fringe benefit (employer pays ~70.5% tax on the value)."
                      : `${countries[country]}: Meal benefit provided by employer. Generally subject to taxation.`
                    }
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Daily Amount (€)</label>
                      <input type="number" value={benefits.mealAmount} onChange={(e) => updateBenefit('mealAmount', e.target.value)} placeholder="4" step="0.5" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <p className="text-xs text-slate-500 mt-1">Calculated for 20 working days per month</p>
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Health Insurance / Sports Allowance" 
                    checked={benefits.health} 
                    onChange={(v) => updateBenefit('health', v)} 
                    info={country === 'EE' 
                      ? "Estonia: Tax-free up to €400 per year (€33.33/month). Amounts above this are taxed as fringe benefits at ~70.5%."
                      : country === 'LV'
                      ? "Latvia: Health and sports benefits are generally taxable as fringe benefits."
                      : "Lithuania: Health and sports benefits are generally taxable as fringe benefits."
                    }
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Monthly Value (€)</label>
                      <input type="number" value={benefits.healthAmount} onChange={(e) => updateBenefit('healthAmount', e.target.value)} placeholder="100" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      {country === 'EE' && healthValue > 33.33 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-xs text-amber-800">
                            <strong>Tax note:</strong> €{healthTaxFree.toFixed(2)}/month is tax-free. 
                            €{healthTaxable.toFixed(2)}/month is subject to fringe benefit tax (~€{healthTaxCost.toFixed(2)} employer cost).
                          </p>
                        </div>
                      )}
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Phone / Internet Allowance" 
                    checked={benefits.phone} 
                    onChange={(v) => updateBenefit('phone', v)} 
                    info="Monthly allowance for phone and internet expenses. Tax treatment varies by country."
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Monthly Amount (€)</label>
                      <input type="number" value={benefits.phoneAmount} onChange={(e) => updateBenefit('phoneAmount', e.target.value)} placeholder="50" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </BenefitToggle>

                  <BenefitToggle label="Office Coffee & Beverages" checked={benefits.coffee} onChange={(v) => updateBenefit('coffee', v)} info="Free coffee, tea, and refreshments provided at the workplace (valued at €1/day)">
                    <p className="text-sm text-slate-600">Estimated value: €{workDays}/month (€1/day × {workDays} working days)</p>
                  </BenefitToggle>

                  <BenefitToggle label="Training / Education Budget" checked={benefits.training} onChange={(v) => updateBenefit('training', v)} info="Annual budget for professional development and training">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Annual Budget (€)</label>
                      <input type="number" value={benefits.trainingAmount} onChange={(e) => updateBenefit('trainingAmount', e.target.value)} placeholder="1000" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </BenefitToggle>

                  <BenefitToggle label="Additional Days Off" checked={benefits.extraDays} onChange={(v) => updateBenefit('extraDays', v)} info="Company-provided extra vacation days beyond legal minimum. These may be health days, earned through length of service, or additional wellness days.">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Extra Days Per Year</label>
                      <input type="number" value={benefits.daysAmount} onChange={(e) => updateBenefit('daysAmount', e.target.value)} placeholder="5" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <p className="text-xs text-slate-500 mt-1">Value calculated as daily salary × extra days</p>
                    </div>
                  </BenefitToggle>
                </div>
              </div>

              {/* Custom Benefits */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-800">Custom Benefits</h3>
                  <button
                    onClick={addCustomBenefit}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Benefit
                  </button>
                </div>
                {customBenefits.length > 0 && (
                  <div className="space-y-2">
                    {customBenefits.map(benefit => (
                      <div key={benefit.id} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={benefit.name}
                            onChange={(e) => updateCustomBenefit(benefit.id, 'name', e.target.value)}
                            placeholder="Benefit name"
                            className="col-span-5 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <input
                            type="number"
                            value={benefit.value}
                            onChange={(e) => updateCustomBenefit(benefit.id, 'value', e.target.value)}
                            placeholder="0"
                            className="col-span-3 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <select
                            value={benefit.frequency}
                            onChange={(e) => updateCustomBenefit(benefit.id, 'frequency', e.target.value)}
                            className="col-span-3 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual</option>
                          </select>
                          <button
                            onClick={() => removeCustomBenefit(benefit.id)}
                            className="col-span-1 p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                <div className="bg-slate-800 rounded-lg p-6 text-white border-l-4 border-red-600">
                  <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Total Annual Compensation</div>
                  <div className="text-4xl font-light mb-1">€{totalAnnualComp.toFixed(2)}</div>
                  <div className="text-sm opacity-75">€{totalMonthlyComp.toFixed(2)} / month</div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider">Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Base Salary</span>
                      <span className="font-mono text-slate-800">€{annualSalary.toFixed(2)}</span>
                    </div>
                    {annualBonus > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Bonus</span>
                        <span className="font-mono text-slate-800">€{annualBonus.toFixed(2)}</span>
                      </div>
                    )}
                    {totalAnnualBenefits > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Benefits</span>
                        <span className="font-mono text-slate-800">€{totalAnnualBenefits.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 font-semibold">
                      <span className="text-slate-800">Total</span>
                      <span className="font-mono text-red-600">€{totalAnnualComp.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {totalAnnualBenefits > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-xs text-slate-600 mb-1 uppercase tracking-wider">Benefits Value</div>
                    <div className="text-2xl font-light text-slate-800">
                      {salary > 0 ? ((totalAnnualBenefits / annualSalary) * 100).toFixed(1) : '0'}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">of base salary</div>
                  </div>
                )}

                {annualTaxCost > 0 && country === 'EE' && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-xs text-amber-700 mb-1 uppercase tracking-wider">
                      <Info className="w-3 h-3 inline mr-1" />
                      Employer Tax Cost
                    </div>
                    <div className="text-lg font-light text-amber-900">€{annualTaxCost.toFixed(2)}/year</div>
                    <div className="text-xs text-amber-600 mt-1">Fringe benefit taxation (Estonia)</div>
                  </div>
                )}

                {additionalValue > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-xs text-blue-700 mb-1 uppercase tracking-wider">
                      <Info className="w-3 h-3 inline mr-1" />
                      Additional Value
                    </div>
                    <div className="text-lg font-light text-blue-900">€{additionalValue.toFixed(2)}</div>
                    <div className="text-xs text-blue-600 mt-1">Car usage value (not taxed)</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              This calculator provides estimates based on {countries[country]} tax regulations. 
              Actual tax treatment may vary. Consult with a tax professional for personalized advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}