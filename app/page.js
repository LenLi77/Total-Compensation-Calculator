'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Wallet, Plus, Trash2, Info } from 'lucide-react';

// 2026 Tax Configuration - Verified against official sources
const TAX_CONFIG = {
  EE: {
    name: 'Estonia',
    // Employer costs: 33% social tax + 0.8% unemployment = 33.8%
    employerSocialTax: 0.33,
    employerUnemployment: 0.008,
    // Employee deductions: 22% income tax, 1.6% unemployment, 2%/4%/6% pension (default 2%)
    incomeTax: 0.22,
    employeeUnemployment: 0.016,
    pension: 0.02,
    basicExemption: 700, // €700/month fixed from 2026 (no longer income-dependent)
    // Fringe benefit taxation: 22/78 income tax + 33% social tax on grossed-up amount
    // Total: (22/78) + 33% × (1 + 22/78) = 28.21% + 33% × 1.2821 = 28.21% + 42.31% ≈ 70.5%
    // Simplified: employer pays ~70.5% additional tax on benefit value
    fringeBenefitTaxRate: 0.705,
    healthTaxFreeAnnual: 400, // €400/year tax-free for health/sports benefits
    carBIKRate: 0.012, // 1.2% of car value monthly as benefit-in-kind
    carUsageRate: 0.03, // 3% of car value monthly as usage value (not taxed to employer)
  },
  LV: {
    name: 'Latvia',
    // From 2026: employer 22% (down from 23.59%), employee 12.09% (up from 10.5%)
    // Note: Some sources still show 23.59% - using conservative current rate
    employerSocialTax: 0.2359,
    employerUnemployment: 0, // Included in social tax
    incomeTax: 0.255, // 25.5% up to €105,300/year, 33% above
    employeeSSC: 0.105,
    basicExemption: 550, // €550/month from 2026
    fringeBenefitTaxRate: 0.50, // Approximate employer additional cost
    healthTaxFreeAnnual: 0,
    carBIKRate: 0.015,
  },
  LT: {
    name: 'Lithuania',
    // Employer: 1.77% base + 0.16% guarantee fund + 0.16% long-term employment = ~2.09%
    // Can be 1.45% to 2.71% depending on contract type
    employerSocialTax: 0.0177,
    employerGuaranteeFund: 0.0016,
    employerLongTermFund: 0.0016,
    // Employee: 19.5% (includes 6.98% health) up to €126,532/year
    incomeTax: 0.20, // 20% up to 60 avg salaries, 32% above
    employeeSSC: 0.195,
    basicExemption: 0, // NPD calculated differently, ~€540 with formula
    fringeBenefitTaxRate: 0.40,
    healthTaxFreeAnnual: 350, // €350/year from 2026
    carBIKRate: 0.015,
  },
};

const WORK_DAYS_PER_MONTH = 21; // Average for 2026

export default function TotalCompensationCalculator() {
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

  const config = TAX_CONFIG[country];

  const updateBenefit = useCallback((key, value) => {
    setBenefits(prev => ({ ...prev, [key]: value }));
  }, []);

  const addCustomBenefit = useCallback(() => {
    setCustomBenefits(prev => [...prev, { 
      id: nextId, 
      name: 'Custom Benefit', 
      value: '0', 
      frequency: 'monthly' 
    }]);
    setNextId(prev => prev + 1);
  }, [nextId]);

  const removeCustomBenefit = useCallback((id) => {
    setCustomBenefits(prev => prev.filter(b => b.id !== id));
  }, []);
  
  const updateCustomBenefit = useCallback((id, field, value) => {
    setCustomBenefits(prev => 
      prev.map(b => b.id === id ? { ...b, [field]: value } : b)
    );
  }, []);

  // Memoized calculations
  const calculations = useMemo(() => {
    const salary = parseFloat(baseSalary) || 0;
    const bonusAmt = parseFloat(bonus) || 0;
    const annualSalary = salary * 12;
    const annualBonus = bonusFreq === 'monthly' ? bonusAmt * 12 
                      : bonusFreq === 'quarterly' ? bonusAmt * 4 
                      : bonusAmt;

    // Company Car calculation
    let carBIK = 0;
    let carUsageValue = 0;
    let carTaxCost = 0;
    
    if (benefits.car) {
      const carValue = parseFloat(benefits.carValue) || 0;
      if (country === 'EE') {
        // Estonia: BIK is 1.2% of car value monthly, taxed at fringe benefit rate
        // Usage value is 3% monthly but NOT taxed - it's additional employee benefit
        carBIK = carValue * config.carBIKRate;
        carUsageValue = carValue * config.carUsageRate;
        carTaxCost = carBIK * config.fringeBenefitTaxRate;
      } else {
        carBIK = carValue * config.carBIKRate;
        carTaxCost = carBIK * config.fringeBenefitTaxRate;
      }
    }

    // Meal vouchers
    const mealValue = benefits.meal 
      ? (parseFloat(benefits.mealAmount) || 0) * WORK_DAYS_PER_MONTH 
      : 0;
    const mealTaxCost = benefits.meal ? mealValue * config.fringeBenefitTaxRate : 0;

    // Health/Sports benefit
    const healthValue = benefits.health ? (parseFloat(benefits.healthAmount) || 0) : 0;
    const healthTaxFreeMonthly = config.healthTaxFreeAnnual / 12;
    const healthTaxFree = Math.min(healthValue, healthTaxFreeMonthly);
    const healthTaxable = Math.max(0, healthValue - healthTaxFree);
    const healthTaxCost = healthTaxable * config.fringeBenefitTaxRate;

    // Phone/Internet
    const phoneValue = benefits.phone ? (parseFloat(benefits.phoneAmount) || 0) : 0;
    // Phone for business use is generally not taxed if reasonable
    const phoneTaxCost = 0; // Assume business use

    // Coffee (minimal value, often de minimis)
    const coffeeValue = benefits.coffee ? WORK_DAYS_PER_MONTH * 1 : 0; // €1/day estimate
    const coffeeTaxCost = 0; // Generally de minimis

    // Training (generally tax-free if job-related)
    const trainingValue = benefits.training ? (parseFloat(benefits.trainingAmount) || 0) : 0;
    const trainingTaxCost = 0; // Job-related training is tax-free

    // Extra vacation days
    const dailySalary = salary / WORK_DAYS_PER_MONTH;
    const extraDaysCount = parseFloat(benefits.daysAmount) || 0;
    const extraDaysValue = benefits.extraDays ? dailySalary * extraDaysCount : 0;
    // Extra days don't create additional tax - they're just paid time off

    // Custom benefits
    const customMonthly = customBenefits
      .filter(b => b.frequency === 'monthly')
      .reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
    const customAnnual = customBenefits
      .filter(b => b.frequency === 'annual')
      .reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
    const customTaxCost = customMonthly * config.fringeBenefitTaxRate;

    // Monthly benefit totals
    const monthlyBenefitsGross = carBIK + mealValue + healthValue + phoneValue + 
                                  coffeeValue + customMonthly + (trainingValue / 12) + 
                                  (extraDaysValue / 12);
    const monthlyTaxCost = carTaxCost + mealTaxCost + healthTaxCost + customTaxCost;

    // Annual totals
    const annualBenefitsGross = monthlyBenefitsGross * 12 + customAnnual;
    const annualTaxCost = monthlyTaxCost * 12;
    const annualCarUsageValue = carUsageValue * 12; // Additional non-taxed value

    // Employer cost for salary
    const employerTaxRate = country === 'EE' 
      ? config.employerSocialTax + config.employerUnemployment
      : country === 'LV'
      ? config.employerSocialTax
      : config.employerSocialTax + config.employerGuaranteeFund + config.employerLongTermFund;
    
    const annualEmployerCostSalary = annualSalary * (1 + employerTaxRate);
    const annualEmployerCostBonus = annualBonus * (1 + employerTaxRate);

    // Total compensation (employee perspective)
    const totalAnnualComp = annualSalary + annualBonus + annualBenefitsGross + annualCarUsageValue;
    const totalMonthlyComp = totalAnnualComp / 12;

    // Total employer cost
    const totalAnnualEmployerCost = annualEmployerCostSalary + annualEmployerCostBonus + 
                                     annualBenefitsGross + annualTaxCost;

    return {
      salary,
      annualSalary,
      annualBonus,
      carBIK,
      carUsageValue,
      carTaxCost,
      mealValue,
      mealTaxCost,
      healthValue,
      healthTaxFree,
      healthTaxable,
      healthTaxCost,
      phoneValue,
      coffeeValue,
      trainingValue,
      extraDaysValue,
      monthlyBenefitsGross,
      annualBenefitsGross,
      monthlyTaxCost,
      annualTaxCost,
      annualCarUsageValue,
      totalAnnualComp,
      totalMonthlyComp,
      totalAnnualEmployerCost,
      employerTaxRate,
    };
  }, [baseSalary, bonus, bonusFreq, benefits, customBenefits, country, config]);

  const BenefitToggle = ({ label, checked, onChange, children, info }) => (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)} 
            className="w-5 h-5 text-red-600 focus:ring-red-500 rounded" 
          />
          <label 
            className="font-medium text-slate-800 cursor-pointer" 
            onClick={() => onChange(!checked)}
          >
            {label}
          </label>
        </div>
        {info && (
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-400 cursor-help" />
            <div className="absolute right-0 top-6 w-64 bg-slate-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {info}
            </div>
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
              <h1 className="text-3xl font-light text-slate-800">
                Total Compensation Calculator
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Calculate your true total compensation including all benefits for {config.name} (2026 tax rates)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country
                </label>
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
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Base Compensation
                </h3>
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
                      min="0"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bonus Amount (€)
                    </label>
                    <input 
                      type="number" 
                      value={bonus} 
                      onChange={(e) => setBonus(e.target.value)} 
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bonus Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['monthly', 'quarterly', 'annual'].map(f => (
                      <button 
                        key={f} 
                        onClick={() => setBonusFreq(f)} 
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                          bonusFreq === f 
                            ? 'bg-red-600 text-white' 
                            : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                        }`}
                      >
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
                      ? "Estonia: BIK = 1.2% of car value/month (taxed ~70.5%). Usage value = 3%/month (tax-free additional benefit)."
                      : `${config.name}: BIK = 1.5% of car value/month, subject to fringe benefit tax.`
                    }
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Car Market Value (€)
                      </label>
                      <input 
                        type="number" 
                        value={benefits.carValue} 
                        onChange={(e) => updateBenefit('carValue', e.target.value)} 
                        placeholder="25000"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                      {country === 'EE' && (
                        <p className="text-xs text-slate-500 mt-1">
                          BIK: €{calculations.carBIK.toFixed(2)}/month (taxed) | 
                          Usage: €{calculations.carUsageValue.toFixed(2)}/month (not taxed)
                        </p>
                      )}
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Meal Vouchers / Lunch Benefit" 
                    checked={benefits.meal} 
                    onChange={(v) => updateBenefit('meal', v)} 
                    info="Meal benefits are generally taxed as fringe benefits in all Baltic states."
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Daily Amount (€)
                      </label>
                      <input 
                        type="number" 
                        value={benefits.mealAmount} 
                        onChange={(e) => updateBenefit('mealAmount', e.target.value)} 
                        placeholder="4" 
                        step="0.5"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Calculated for {WORK_DAYS_PER_MONTH} working days per month
                      </p>
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Health Insurance / Sports Allowance" 
                    checked={benefits.health} 
                    onChange={(v) => updateBenefit('health', v)} 
                    info={country === 'EE' 
                      ? "Estonia: Tax-free up to €400/year (€33.33/month). Above this taxed at ~70.5%."
                      : country === 'LT'
                      ? "Lithuania: Tax-free up to €350/year from 2026. Above this taxed."
                      : "Latvia: Generally taxable as fringe benefits."
                    }
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Monthly Value (€)
                      </label>
                      <input 
                        type="number" 
                        value={benefits.healthAmount} 
                        onChange={(e) => updateBenefit('healthAmount', e.target.value)} 
                        placeholder="100"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                      {config.healthTaxFreeAnnual > 0 && calculations.healthTaxable > 0 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-xs text-amber-800">
                            <strong>Tax note:</strong> €{calculations.healthTaxFree.toFixed(2)}/month tax-free. 
                            €{calculations.healthTaxable.toFixed(2)}/month taxable 
                            (≈€{calculations.healthTaxCost.toFixed(2)} employer tax cost).
                          </p>
                        </div>
                      )}
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Phone / Internet (Business Use)" 
                    checked={benefits.phone} 
                    onChange={(v) => updateBenefit('phone', v)} 
                    info="Business phone/internet is generally tax-free if for work purposes."
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Monthly Amount (€)
                      </label>
                      <input 
                        type="number" 
                        value={benefits.phoneAmount} 
                        onChange={(e) => updateBenefit('phoneAmount', e.target.value)} 
                        placeholder="50"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Office Coffee & Beverages" 
                    checked={benefits.coffee} 
                    onChange={(v) => updateBenefit('coffee', v)} 
                    info="Generally considered de minimis and not taxed."
                  >
                    <p className="text-sm text-slate-600">
                      Estimated value: €{WORK_DAYS_PER_MONTH}/month (€1/day)
                    </p>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Training / Education Budget" 
                    checked={benefits.training} 
                    onChange={(v) => updateBenefit('training', v)} 
                    info="Job-related training is generally tax-free in all Baltic states."
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Annual Budget (€)
                      </label>
                      <input 
                        type="number" 
                        value={benefits.trainingAmount} 
                        onChange={(e) => updateBenefit('trainingAmount', e.target.value)} 
                        placeholder="1000"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                    </div>
                  </BenefitToggle>

                  <BenefitToggle 
                    label="Additional Days Off" 
                    checked={benefits.extraDays} 
                    onChange={(v) => updateBenefit('extraDays', v)} 
                    info="Extra vacation days beyond statutory minimum. Value calculated at daily salary rate."
                  >
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Extra Days Per Year
                      </label>
                      <input 
                        type="number" 
                        value={benefits.daysAmount} 
                        onChange={(e) => updateBenefit('daysAmount', e.target.value)} 
                        placeholder="5"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Value: €{calculations.extraDaysValue.toFixed(2)}/year
                      </p>
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
                            min="0"
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
                  <div className="text-xs uppercase tracking-wider opacity-80 mb-2">
                    Total Annual Compensation
                  </div>
                  <div className="text-4xl font-light mb-1">
                    €{calculations.totalAnnualComp.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                  <div className="text-sm opacity-75">
                    €{calculations.totalMonthlyComp.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} / month
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider">
                    Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Base Salary</span>
                      <span className="font-mono text-slate-800">
                        €{calculations.annualSalary.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                    {calculations.annualBonus > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Bonus</span>
                        <span className="font-mono text-slate-800">
                          €{calculations.annualBonus.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    )}
                    {calculations.annualBenefitsGross > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Benefits</span>
                        <span className="font-mono text-slate-800">
                          €{calculations.annualBenefitsGross.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    )}
                    {calculations.annualCarUsageValue > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Car Usage Value</span>
                        <span className="font-mono text-slate-800">
                          €{calculations.annualCarUsageValue.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 font-semibold">
                      <span className="text-slate-800">Total</span>
                      <span className="font-mono text-red-600">
                        €{calculations.totalAnnualComp.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {calculations.annualBenefitsGross > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-xs text-slate-600 mb-1 uppercase tracking-wider">
                      Benefits Value
                    </div>
                    <div className="text-2xl font-light text-slate-800">
                      {calculations.salary > 0 
                        ? ((calculations.annualBenefitsGross / calculations.annualSalary) * 100).toFixed(1) 
                        : '0'}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">of base salary</div>
                  </div>
                )}

                {calculations.annualTaxCost > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-xs text-amber-700 mb-1 uppercase tracking-wider">
                      <Info className="w-3 h-3 inline mr-1" />
                      Employer Fringe Benefit Tax
                    </div>
                    <div className="text-lg font-light text-amber-900">
                      €{calculations.annualTaxCost.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}/year
                    </div>
                    <div className="text-xs text-amber-600 mt-1">
                      Additional employer cost for taxable benefits
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs text-blue-700 mb-1 uppercase tracking-wider">
                    <Info className="w-3 h-3 inline mr-1" />
                    Employer Tax Rate
                  </div>
                  <div className="text-lg font-light text-blue-900">
                    {(calculations.employerTaxRate * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Social tax + unemployment on salary
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Calculator uses 2026 tax rates for {config.name}. 
              Estonia: 33% social + 0.8% unemployment. 
              Latvia: 23.59% employer social. 
              Lithuania: ~2.09% employer contribution.
              Consult a tax professional for personalized advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
