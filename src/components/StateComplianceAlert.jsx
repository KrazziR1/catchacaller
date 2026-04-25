import { AlertTriangle, Info } from 'lucide-react';

const STATE_INFO = {
  CA: {
    name: 'California (CCPA)',
    rules: 'Requires prior express written consent. Cannot send SMS without explicit written permission from the recipient.',
    link: 'https://oag.ca.gov/privacy/ccpa',
  },
  NY: {
    name: 'New York (GBL 527)',
    rules: 'Requires prior express written consent for SMS marketing. Established business relationship alone is insufficient.',
    link: 'https://www.dos.ny.gov/consumer-protection',
  },
};

export default function StateComplianceAlert({ state, restrictions }) {
  if (!state || state === 'UNKNOWN') return null;

  const info = STATE_INFO[state];
  const isStrict = ['CA', 'NY'].includes(state);

  return (
    <div className={`p-4 rounded-xl border flex gap-3 ${
      isStrict
        ? 'bg-red-50 border-red-200'
        : 'bg-blue-50 border-blue-200'
    }`}>
      {isStrict ? (
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      ) : (
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${isStrict ? 'text-red-800' : 'text-blue-800'}`}>
          {info?.name || state} Compliance Required
        </p>
        <p className={`text-xs mt-1.5 leading-relaxed ${isStrict ? 'text-red-700' : 'text-blue-700'}`}>
          {restrictions || info?.rules}
        </p>
        {info?.link && (
          <a
            href={info.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs font-semibold underline mt-2 inline-block ${isStrict ? 'text-red-800' : 'text-blue-800'}`}
          >
            View State Requirements →
          </a>
        )}
      </div>
    </div>
  );
}