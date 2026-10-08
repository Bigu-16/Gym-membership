import React from 'react';
import { Check, ShieldCheck, Printer } from 'lucide-react';
import { SCHEDULE_TIMETABLE_MATRIX, DISCLAIMER_TEXT, isCellSelected } from '../../config/scheduleConfig';

const OfficialRegistrationSheet = ({
  data = null,
  showPrintButton = false,
  className = ''
}) => {
  const memberName = data?.name || '';
  const memberAge = data?.age || '';
  const memberGender = data?.gender || '';
  const memberEmiratesId = data?.emiratesId || data?.trainees?.[0]?.emiratesId || '';
  const memberPhone = data?.phone || '';
  const parentName = data?.parentName || '';
  const selectedSlot = data?.schedule?.slot || data?.slot || '';
  const selectedService = data?.service || data?.plan || '';
  const dateStr = data?.date || new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`p-6 sm:p-10 font-sans print:p-6 select-text text-[11px] leading-relaxed text-gray-800 bg-white rounded-2xl border border-gray-200 shadow-xl ${className}`}>
      {/* Optional Top Print Control */}
      {showPrintButton && (
        <div className="print:hidden flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
            <span>Official Document Preview</span>
            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
              Ready to Print
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Printer size={14} /> Print Document
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b-2 border-orange-500 pb-4 mb-5">
        <div className="flex justify-between items-center mb-1">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-2xl">
            🥋
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-orange-600 uppercase">
              N & T TAEKWONDO AND KARATE CENTER
            </h1>
            <p className="text-[11px] font-bold tracking-[0.25em] text-gray-600 uppercase mt-0.5">
              REGISTRATION FORM
            </p>
          </div>
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs">
            N & T
          </div>
        </div>
        <div className="text-right text-[11px] text-gray-600 font-medium">
          <span className="font-bold">DATE:</span> <span className="border-b border-gray-400 px-4 py-0.5 inline-block min-w-[120px] text-center">{dateStr}</span>
        </div>
      </div>

      {/* Member Particulars */}
      <div className="space-y-3 mb-6 bg-orange-50/40 p-4 rounded-xl border border-orange-100">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold uppercase text-gray-700">FULL NAME:</span>
          <span className="border-b border-gray-400 px-3 py-1 font-semibold text-gray-900 flex-grow">
            {memberName}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <span className="font-bold uppercase text-gray-700">GENDER:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${memberGender.toLowerCase() === 'male' ? 'bg-orange-500 border-orange-600 text-white' : 'border-gray-400'}`}>
                {memberGender.toLowerCase() === 'male' && <Check size={12} />}
              </span>
              <span>MALE</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${memberGender.toLowerCase() === 'female' ? 'bg-orange-500 border-orange-600 text-white' : 'border-gray-400'}`}>
                {memberGender.toLowerCase() === 'female' && <Check size={12} />}
              </span>
              <span className="font-bold text-orange-950">FEMALE</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-gray-700">AGE:</span>
            <span className="border-b border-gray-400 px-3 py-0.5 font-bold text-gray-900 min-w-[60px] text-center">
              {memberAge}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-gray-700">Mob.:</span>
            <span className="border-b border-gray-400 px-2 py-0.5 font-semibold text-gray-900 flex-grow">
              {memberPhone}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-gray-700">WhatsApp:</span>
            <span className="border-b border-gray-400 px-2 py-0.5 font-semibold text-gray-900 flex-grow">
              {memberPhone}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-gray-700">Emirates ID:</span>
            <span className="border-b border-gray-400 px-2 py-0.5 font-semibold text-gray-900 flex-grow">
              {memberEmiratesId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-gray-700">Parent:</span>
            <span className="border-b border-gray-400 px-2 py-0.5 font-semibold text-gray-900 flex-grow">
              {parentName}
            </span>
          </div>
        </div>
      </div>

      {/* Schedule Table (Exact reproduction from physical document) */}
      <div className="mb-6 overflow-x-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-orange-800 mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-orange-900">TRAINING SCHEDULE</span>
            <span className="text-gray-400">|</span>
            <span>Weekly Training Schedule Timetable</span>
          </div>
          <span className="text-[9px] text-gray-500 font-normal">Active enrolled class highlighted</span>
        </div>
        <table className="w-full border-collapse border border-orange-300 text-[10px] text-center">
          <thead>
            <tr className="bg-orange-500 text-white font-bold uppercase tracking-wider">
              <th className="border border-orange-400 py-1.5 px-1 w-24">TIME</th>
              <th className="border border-orange-400 py-1.5 px-1">MONDAY</th>
              <th className="border border-orange-400 py-1.5 px-1">TUESDAY</th>
              <th className="border border-orange-400 py-1.5 px-1">WEDNESDAY</th>
              <th className="border border-orange-400 py-1.5 px-1">THURSDAY</th>
              <th className="border border-orange-400 py-1.5 px-1">FRIDAY</th>
              <th className="border border-orange-400 py-1.5 px-1">SATURDAY</th>
            </tr>
          </thead>
          <tbody>
            {SCHEDULE_TIMETABLE_MATRIX.map((row, idx) => {
              const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-orange-50/50' : 'bg-white'}>
                  <td className="border border-orange-200 py-1.5 px-1 font-bold text-gray-700 bg-orange-100/60 whitespace-nowrap">
                    {row.time}
                  </td>
                  {days.map(dayKey => {
                    const cellVal = row[dayKey];
                    const isMatch = selectedSlot
                      ? (isCellSelected(dayKey, row.time, cellVal, selectedSlot) || 
                         (row.time.includes('4:00 PM') && selectedService.toLowerCase().includes('little kids') && ['tuesday', 'thursday', 'saturday'].includes(dayKey)))
                      : false;
                    return (
                      <td 
                        key={dayKey}
                        className={`border border-orange-200 py-1.5 px-1 ${isMatch ? 'bg-amber-200 font-bold text-gray-900 ring-2 ring-orange-500 rounded-sm' : 'text-gray-800'}`}
                      >
                        {cellVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Medical Condition Checkbox */}
      <div className="flex items-center gap-6 text-xs mb-6 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <span className="font-bold uppercase text-gray-800">Do you have any medical condition?</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-gray-400 flex items-center justify-center"></span>
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-1.5 font-bold text-emerald-800">
            <span className="w-4 h-4 rounded border border-emerald-600 bg-emerald-500 text-white flex items-center justify-center">
              <Check size={12} />
            </span>
            <span>No</span>
          </label>
        </div>
      </div>

      {/* Activities Pricing Table (Exact from physical document) */}
      <div className="mb-6 overflow-x-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-orange-800 mb-1.5">
          Activities & Pricing Packages (AED)
        </div>
        <table className="w-full border-collapse border border-orange-300 text-[10px] text-center">
          <thead>
            <tr className="bg-orange-500 text-white font-bold uppercase tracking-wider">
              <th className="border border-orange-400 py-1.5 px-2 text-left">Activities</th>
              <th className="border border-orange-400 py-1.5 px-2">Weekly three class<br/>One month</th>
              <th className="border border-orange-400 py-1.5 px-2">Weekly three class<br/>Three months</th>
              <th className="border border-orange-400 py-1.5 px-2">Weekly three class<br/>Six months</th>
              <th className="border border-orange-400 py-1.5 px-2">Weekly three class<br/>One year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-200">
            {[
              { name: 'Karate / Little Kids Karate', one: '300 / 350', three: '800 / 900*', six: '1400', year: '2550', highlighted: selectedService ? selectedService.toLowerCase().includes('karate') : false },
              { name: 'Taekwondo (Teak won do)', one: '300 / 350', three: '800 / 900*', six: '1400', year: '2550', highlighted: selectedService ? selectedService.toLowerCase().includes('taekwondo') : false },
              { name: 'ZUMBA FITNESS', one: '350', three: '800 / 900', six: '1450', year: '2550', highlighted: selectedService ? selectedService.toLowerCase().includes('zumba') : false },
              { name: 'ADULT KARATE', one: '300 / 350', three: '800 / 900*', six: '1400', year: '2550', highlighted: selectedService ? selectedService.toLowerCase().includes('adult karate') : false },
              { name: 'ADULT KICKBOXING', one: '300 / 350', three: '800 / 900^', six: '1400', year: '2550', highlighted: selectedService ? selectedService.toLowerCase().includes('adult kickboxing') : false },
              { name: 'KICKBOXING', one: '300 / 350', three: '800 / 900^', six: '1400', year: '2550', highlighted: selectedService ? selectedService.toLowerCase().includes('kickboxing') : false },
            ].map((row, idx) => (
              <tr key={idx} className={row.highlighted ? 'bg-amber-100 font-bold text-gray-900' : (idx % 2 === 0 ? 'bg-orange-50/30' : 'bg-white')}>
                <td className="border border-orange-200 py-1.5 px-2 text-left font-semibold">
                  {row.name}
                </td>
                <td className="border border-orange-200 py-1.5 px-2">{row.one}</td>
                <td className="border border-orange-200 py-1.5 px-2">{row.three}</td>
                <td className="border border-orange-200 py-1.5 px-2">{row.six}</td>
                <td className="border border-orange-200 py-1.5 px-2">{row.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[8px] text-gray-500 mt-1 italic">
          * Includes Free Uniform for 3-Month package | ^ Includes Free Gloves for 3-Month package
        </p>
      </div>

      {/* Terms and Conditions / Legal Disclaimer */}
      <div className="mb-6 text-[9px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
        <p className="font-bold text-gray-800 uppercase">As per N & T TEAKWONDO&KARATE CENTER Management:</p>
        <p className="leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>
      </div>

      {/* Signatures */}
      <div className="pt-4 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs">
        <div>
          <div className="h-10 border-b border-gray-400 flex items-end pb-1 font-serif italic text-lg text-indigo-950 font-bold">
            {parentName}
          </div>
          <p className="text-[10px] uppercase font-bold text-gray-600 mt-1">Student / Parent's Signature</p>
        </div>
        <div>
          <div className="h-10 border-b border-gray-400 flex items-end pb-1 text-xs font-bold text-emerald-700">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} /> Approved & Registered - N&T Center
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold text-gray-600 mt-1">Administrator</p>
        </div>
      </div>
    </div>
  );
};

export default OfficialRegistrationSheet;
