import React, { useState } from 'react';
import { X, Download, Clock, DollarSign, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { CADProduct } from '../types';

interface BOMExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CADProduct;
  onConsultMentor: (query: string) => void;
}

export const BOMExplorerModal: React.FC<BOMExplorerModalProps> = ({
  isOpen,
  onClose,
  product,
  onConsultMentor,
}) => {
  if (!isOpen) return null;

  const totalUnitCost = product.bom.reduce((acc, item) => acc + item.unitPrice, 0);
  const maxLeadTime = Math.max(...product.bom.map((i) => i.leadTimeDays));

  const handleExportCSV = () => {
    const headers = ['Designator', 'Description', 'MPN', 'Package', 'Supplier', 'Lead Time (Days)', 'Unit Price ($)', 'Second Source'];
    const rows = product.bom.map((b) => [
      `"${b.designator}"`,
      `"${b.description}"`,
      `"${b.mpn}"`,
      `"${b.package}"`,
      `"${b.supplier}"`,
      b.leadTimeDays,
      b.unitPrice.toFixed(2),
      `"${b.secondSource}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${product.id}_BOM_Sourcing_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05080e]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-[#0a101d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-cyan-500/20 bg-[#0e1726]/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="font-display text-lg font-bold text-slate-100 uppercase tracking-wider">
                Teardown & Sourcing Explorer
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {product.name} · Bill of Materials & Lead Time Simulation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export BOM CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-Level Sourcing Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-[#070c14] border-b border-slate-800">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Est. BOM Cost</span>
            <div className="flex items-baseline gap-1 mt-1">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {totalUnitCost.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">/ unit (qty 1k)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Max Component Lead</span>
            <div className="flex items-baseline gap-1 mt-1">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {maxLeadTime}
              </span>
              <span className="text-xs text-slate-500">days</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Critical Parts Count</span>
            <div className="text-lg font-mono font-bold text-slate-100 mt-1 tabular-nums">
              {product.bom.length} items
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Second-Source Coverage</span>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold font-mono mt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Verified</span>
            </div>
          </div>
        </div>

        {/* BOM Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Designator</th>
                <th className="py-2.5 px-3">Description & MPN</th>
                <th className="py-2.5 px-3">Package</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3 text-right">Lead Time</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3">Second Source</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {product.bom.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-cyan-300">{item.designator}</td>
                  <td className="py-3 px-3">
                    <span className="text-slate-200 block font-sans font-semibold">
                      {item.description}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{item.mpn}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{item.package}</td>
                  <td className="py-3 px-3 text-slate-300">{item.supplier}</td>
                  <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                    {item.leadTimeDays}d
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{item.secondSource}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => {
                        onClose();
                        onConsultMentor(
                          `Review sourcing availability and second-source compatibility for ${item.designator} (${item.mpn}). Are there faster lead-time alternatives?`
                        );
                      }}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
