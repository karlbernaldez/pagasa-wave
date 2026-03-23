import {
  Mail, Phone, MapPin, Clock, MessageCircle,
  Globe, Users, Shield, Zap
} from 'lucide-react';

const ICONS = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  clock: Clock,
  'message-circle': MessageCircle,
  globe: Globe,
  users: Users,
  shield: Shield,
  zap: Zap,
};

export default function IconPicker({ value, onChange, dark }) {
  const Selected = ICONS[value] || Mail;

  return (
    <div className="flex items-center gap-3">

      {/* preview */}
      <div className={`h-9 w-9 flex items-center justify-center rounded-lg border
        ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}
      `}>
        <Selected className="h-5 w-5" />
      </div>

      {/* dropdown */}
      <select
        value={value || 'mail'}
        onChange={(e)=>onChange(e.target.value)}
        className={`flex-1 px-3 py-2 rounded-lg border text-sm
        ${dark
          ? 'border-slate-700 bg-slate-900 text-slate-200'
          : 'border-slate-300 bg-white text-slate-800'
        }`}
      >
        {Object.keys(ICONS).map(name=>(
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

    </div>
  );
}