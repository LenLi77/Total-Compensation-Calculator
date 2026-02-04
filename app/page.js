'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRightLeft } from 'lucide-react';

export default function BalticSalaryCalculator() {
  const [country, setCountry] = useState('EE');
  const [direction, setDirection] = useState('gross-to-net');
  const [amount, setAmount] = useState('2000');
  const [pensionRate, setPensionRate] = useState(2);
  const [ltContractType, setLtContractType] = useState('permanent');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparisonBase, setComparisonBase] = useState('gross'); // 'gross' or 'net'

  const taxRates = {
    EE: {
      incomeTax: 0.22,
      basicExemption: 700,
      employerSocialTax: 0.33,
      employeeUnemployment: 0.016,
      employerUnemployment: 0.008,
      pensionFund: 0.02
    },
    LV: {
      incomeTax: 0.255,
      incomeTaxHigh: 0.33,
      threshold: 105300,
      basicExemption: 550,
      employerSocial: 0.2359,
      employeeSocial: 0.105
    },
    LT: {
      incomeTax: 0.20,
      incomeTaxMid: 0.25,
      incomeTaxHigh: 0.32,
      avgSalary: 2312.15,
      employerSocialPermanent: 0.0177,
      employerSocialFixedTerm: 0.0249,
      employeeSocial: 0.195,
      healthInsurance: 0.0698
    }
  };

  const calculateEstonia = (gross, isGrossToNet, pensionPct = pensionRate) => {
    if (isGrossToNet) {
      // FIXED: Income tax is calculated AFTER pension, unemployment, and tax-free amount are deducted
      const unemployment = gross * taxRates.EE.employeeUnemployment;
      const pension = gross * (pensionPct / 100);
      const monthlyExemption = taxRates.EE.basicExemption;
      
      // Taxable income = gross - unemployment - pension - exemption
      const taxableIncome = Math.max(0, gross - unemployment - pension - monthlyExemption);
      const incomeTax = taxableIncome * taxRates.EE.incomeTax;
      
      const totalDeductions = incomeTax + unemployment + pension;
      const net = gross - totalDeductions;
      
      const socialTax = gross * taxRates.EE.employerSocialTax;
      const employerUnemployment = gross * taxRates.EE.employerUnemployment;
      const employerCost = gross + socialTax + employerUnemployment;
      
      return {
        gross,
        net: Math.round(net * 100) / 100,
        employerCost: Math.round(employerCost * 100) / 100,
        breakdown: {
          incomeTax: Math.round(incomeTax * 100) / 100,
          unemployment: Math.round(unemployment * 100) / 100,
          pension: Math.round(pension * 100) / 100,
          pensionRate: pensionPct,
          socialTax: Math.round(socialTax * 100) / 100,
          employerUnemployment: Math.round(employerUnemployment * 100) / 100
        }
      };
    } else {
      let gross = parseFloat(amount);
      for (let i = 0; i < 20; i++) {
        const calc = calculateEstonia(gross, true, pensionPct);
        const diff = calc.net - parseFloat(amount);
        if (Math.abs(diff) < 0.01) break;
        gross -= diff * 0.5;
      }
      return calculateEstonia(gross, true, pensionPct);
    }
  };

  const calculateLatvia = (gross, isGrossToNet) => {
    if (isGrossToNet) {
      const monthlyExemption = taxRates.LV.basicExemption;
      const employeeSocial = gross * taxRates.LV.employeeSocial;
      const taxableIncome = Math.max(0, gross - employeeSocial - monthlyExemption);
      
      const incomeTax = taxableIncome * taxRates.LV.incomeTax;
      
      const totalDeductions = incomeTax + employeeSocial;
      const net = gross - totalDeductions;
      
      const employerSocial = gross * taxRates.LV.employerSocial;
      const employerCost = gross + employerSocial;
      
      return {
        gross,
        net: Math.round(net * 100) / 100,
        employerCost: Math.round(employerCost * 100) / 100,
        breakdown: {
          incomeTax: Math.round(incomeTax * 100) / 100,
          employeeSocial: Math.round(employeeSocial * 100) / 100,
          employerSocial: Math.round(employerSocial * 100) / 100
        }
      };
    } else {
      let gross = parseFloat(amount);
      for (let i = 0; i < 20; i++) {
        const calc = calculateLatvia(gross, true);
        const diff = calc.net - parseFloat(amount);
        if (Math.abs(diff) < 0.01) break;
        gross -= diff * 0.5;
      }
      return calculateLatvia(gross, true);
    }
  };

  const calculateLithuania = (gross, isGrossToNet, contractType = ltContractType) => {
    if (isGrossToNet) {
      // Both social security and income tax are calculated from gross salary
      const employeeSocial = gross * taxRates.LT.employeeSocial;
      const incomeTax = gross * taxRates.LT.incomeTax;
      
      const totalDeductions = incomeTax + employeeSocial;
      const net = gross - totalDeductions;
      
      const employerSocialRate = contractType === 'permanent' 
        ? taxRates.LT.employerSocialPermanent 
        : taxRates.LT.employerSocialFixedTerm;
      const employerSocial = gross * employerSocialRate;
      const employerCost = gross + employerSocial;
      
      return {
        gross,
        net: Math.round(net * 100) / 100,
        employerCost: Math.round(employerCost * 100) / 100,
        breakdown: {
          incomeTax: Math.round(incomeTax * 100) / 100,
          employeeSocial: Math.round(employeeSocial * 100) / 100,
          employerSocial: Math.round(employerSocial * 100) / 100,
          employerSocialRate: employerSocialRate * 100,
          contractType: contractType
        }
      };
    } else {
      let gross = parseFloat(amount);
      for (let i = 0; i < 20; i++) {
        const calc = calculateLithuania(gross, true, contractType);
        const diff = calc.net - parseFloat(amount);
        if (Math.abs(diff) < 0.01) break;
        gross -= diff * 0.5;
      }
      return calculateLithuania(gross, true, contractType);
    }
  };

  useEffect(() => {
    setIsCalculating(true);
    
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || amount === '') {
      setResult(null);
      setComparisonResults(null);
      setIsCalculating(false);
      return;
    }

    try {
      let calc;
      const isGrossToNet = direction === 'gross-to-net';
      
      if (country === 'EE') {
        calc = calculateEstonia(amt, isGrossToNet, pensionRate);
      } else if (country === 'LV') {
        calc = calculateLatvia(amt, isGrossToNet);
      } else if (country === 'LT') {
        calc = calculateLithuania(amt, isGrossToNet, ltContractType);
      }
      
      if (calc && typeof calc.gross === 'number' && typeof calc.net === 'number' && typeof calc.employerCost === 'number') {
        setResult(calc);
        
        // Generate comparison results based on the selected comparison base
        let eeResult, lvResult, ltResult;
        
        if (comparisonBase === 'gross') {
          // Compare based on gross salary
          eeResult = calculateEstonia(calc.gross, true, pensionRate);
          lvResult = calculateLatvia(calc.gross, true);
          ltResult = calculateLithuania(calc.gross, true, ltContractType);
        } else {
          // Compare based on net salary - find equivalent gross for each country
          eeResult = calculateEstonia(calc.net, false, pensionRate);
          lvResult = calculateLatvia(calc.net, false);
          ltResult = calculateLithuania(calc.net, false, ltContractType);
        }
        
        setComparisonResults({
          EE: eeResult,
          LV: lvResult,
          LT: ltResult
        });
      } else {
        setResult(null);
        setComparisonResults(null);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setResult(null);
      setComparisonResults(null);
    }
    
    setIsCalculating(false);
  }, [country, direction, amount, pensionRate, ltContractType, comparisonBase]);

  const countryNames = {
    EE: 'Estonia',
    LV: 'Latvia',
    LT: 'Lithuania'
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-10">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Calculator className="w-7 h-7 text-red-600" />
              <h1 className="text-3xl font-light text-slate-800">
                Baltic Salary Calculator
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Calculate net/gross salary and employer costs for Estonia, Latvia, and Lithuania using 2026 tax rates
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="EE">🇪🇪 Estonia</option>
                <option value="LV">🇱🇻 Latvia</option>
                <option value="LT">🇱🇹 Lithuania</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Calculation Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="gross-to-net">Gross → Net</option>
                <option value="net-to-gross">Net → Gross</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {direction === 'gross-to-net' ? 'Gross Salary' : 'Net Salary'} (€)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2000"
                className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Estonia Pension Plan Selector */}
          {country === 'EE' && (
            <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Pension Fund Contribution Rate
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 2, 4, 6].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPensionRate(rate)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                      pensionRate === rate
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lithuania Contract Type Selector */}
          {country === 'LT' && (
            <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Employment Contract Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLtContractType('permanent')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    ltContractType === 'permanent'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                  }`}
                >
                  Permanent (1.77%)
                </button>
                <button
                  onClick={() => setLtContractType('fixed-term')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    ltContractType === 'fixed-term'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                  }`}
                >
                  Fixed-term (2.49%)
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isCalculating && (
            <div className="space-y-6 mt-8">
              {/* Comparison Toggle */}
              <div className="flex flex-col items-center gap-4 pb-6 border-b border-slate-200">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {showComparison ? 'Hide' : 'Show'} Country Comparison
                </button>
                
                {showComparison && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Compare based on:</span>
                    <button
                      onClick={() => setComparisonBase('gross')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        comparisonBase === 'gross'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                      }`}
                    >
                      Same Gross Salary
                    </button>
                    <button
                      onClick={() => setComparisonBase('net')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        comparisonBase === 'net'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                      }`}
                    >
                      Same Net Salary
                    </button>
                  </div>
                )}
              </div>

              {/* Comparison Table */}
              {showComparison && comparisonResults && (
                <div className="bg-white rounded border border-slate-300 overflow-hidden mb-8">
                  <div className="bg-slate-800 text-white px-6 py-4 border-l-4 border-red-600">
                    <h3 className="text-lg font-medium">Compare All Baltic Countries</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      {comparisonBase === 'gross' 
                        ? `Based on €${result.gross.toFixed(2)} gross salary`
                        : `Based on €${result.net.toFixed(2)} net salary`
                      }
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Country</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Gross</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Net</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Employer Cost</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Net/Gross</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Tax Burden</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {['EE', 'LV', 'LT'].map((countryCode) => {
                          const data = comparisonResults[countryCode];
                          const isSelected = country === countryCode;
                          const netGrossRatio = (data.net / data.gross) * 100;
                          const taxBurden = ((data.employerCost - data.net) / data.employerCost) * 100;
                          
                          return (
                            <tr key={countryCode} className={isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">
                                    {countryCode === 'EE' ? '🇪🇪' : countryCode === 'LV' ? '🇱🇻' : '🇱🇹'}
                                  </span>
                                  <span className={`font-medium ${isSelected ? 'text-slate-800' : 'text-slate-700'}`}>
                                    {countryNames[countryCode]}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-sm text-slate-800">
                                €{data.gross.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-slate-800">
                                €{data.net.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-slate-800">
                                €{data.employerCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                                  {netGrossRatio.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                                  {taxBurden.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-lg p-6 text-white border-l-4 border-red-600">
                  <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Gross Salary</div>
                  <div className="text-3xl font-light mb-1">€{(result.gross || 0).toFixed(2)}</div>
                  <div className="text-xs opacity-70">Monthly</div>
                </div>

                <div className="bg-slate-700 rounded-lg p-6 text-white">
                  <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Net Salary</div>
                  <div className="text-3xl font-light mb-1">€{(result.net || 0).toFixed(2)}</div>
                  <div className="text-xs opacity-70">Take-home</div>
                </div>

                <div className="bg-slate-600 rounded-lg p-6 text-white">
                  <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Employer Cost</div>
                  <div className="text-3xl font-light mb-1">€{(result.employerCost || 0).toFixed(2)}</div>
                  <div className="text-xs opacity-70">Total cost</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Breakdown for {countryNames[country]}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                    <span className="text-slate-700 text-sm">Gross Salary</span>
                    <span className="font-mono font-medium text-slate-800">€{(result.gross || 0).toFixed(2)}</span>
                  </div>

                  {country === 'EE' && result.breakdown && (
                    <>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Unemployment Insurance (1.6%)</span>
                        <span className="font-mono">−€{(result.breakdown.unemployment || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Pension Fund ({result.breakdown.pensionRate}%)</span>
                        <span className="font-mono">−€{(result.breakdown.pension || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Income Tax (22% on taxable)</span>
                        <span className="font-mono">−€{(result.breakdown.incomeTax || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {country === 'LV' && result.breakdown && (
                    <>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Employee Social Security (10.5%)</span>
                        <span className="font-mono">−€{(result.breakdown.employeeSocial || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Income Tax (25.5%)</span>
                        <span className="font-mono">−€{(result.breakdown.incomeTax || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {country === 'LT' && result.breakdown && (
                    <>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Employee Social Security (19.5%)</span>
                        <span className="font-mono">−€{(result.breakdown.employeeSocial || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Income Tax (20%)</span>
                        <span className="font-mono">−€{(result.breakdown.incomeTax || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-300 font-medium pt-3">
                    <span className="text-slate-800">Net Salary</span>
                    <span className="font-mono text-slate-800">€{(result.net || 0).toFixed(2)}</span>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-slate-300">
                    <h4 className="font-medium text-slate-800 mb-3 text-sm">Employer Costs</h4>
                    
                    <div className="flex justify-between items-center py-2 text-sm">
                      <span className="text-slate-700">Gross Salary</span>
                      <span className="font-mono text-slate-800">€{(result.gross || 0).toFixed(2)}</span>
                    </div>

                    {country === 'EE' && result.breakdown && (
                      <>
                        <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                          <span className="pl-4">Social Tax (33%)</span>
                          <span className="font-mono">+€{(result.breakdown.socialTax || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                          <span className="pl-4">Unemployment Insurance (0.8%)</span>
                          <span className="font-mono">+€{(result.breakdown.employerUnemployment || 0).toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {country === 'LV' && result.breakdown && (
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Employer Social Security (23.59%)</span>
                        <span className="font-mono">+€{(result.breakdown.employerSocial || 0).toFixed(2)}</span>
                      </div>
                    )}

                    {country === 'LT' && result.breakdown && (
                      <div className="flex justify-between items-center py-2 text-slate-600 text-sm">
                        <span className="pl-4">Employer Social Security ({result.breakdown.employerSocialRate}%)</span>
                        <span className="font-mono">+€{(result.breakdown.employerSocial || 0).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-300 font-medium pt-3">
                      <span className="text-slate-800">Total Employer Cost</span>
                      <span className="font-mono text-slate-800">€{(result.employerCost || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Efficiency Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="text-xs text-slate-600 mb-1 uppercase tracking-wider">Net / Gross Ratio</div>
                  <div className="text-2xl font-light text-slate-800">
                    {result.gross > 0 ? ((result.net / result.gross) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="text-xs text-slate-600 mb-1 uppercase tracking-wider">Total Tax Burden</div>
                  <div className="text-2xl font-light text-red-600">
                    {result.employerCost > 0 ? (((result.employerCost - result.net) / result.employerCost) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Calculations based on 2026 tax rates. Estonia: Income tax calculated after unemployment insurance, pension, and tax-free amount deducted. Lithuania: Both social security and income tax calculated from gross salary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
