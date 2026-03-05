type Profile = {
  id: string;
  display_name: string;
  email?: string | null;
  role: 'admin' | 'yoledet' | 'cook' | 'deliverer';
  is_approved: boolean;
  shabbat_enabled?: boolean | null;
  created_at?: string;
};

type Props = {
  profile: Profile;
  approveAction: (formData: FormData) => void;
  toggleShabbatAction: (formData: FormData) => void;
};

export default function UserApprovalCard({ profile, approveAction, toggleShabbatAction }: Props) {
  const createdAt = profile.created_at ? new Date(profile.created_at) : null;

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col text-right">
          <span className="font-semibold text-slate-900">{profile.display_name}</span>
          {profile.email && (
            <span className="text-xs text-slate-500 break-all">{profile.email}</span>
          )}
          {createdAt && (
            <span className="text-[11px] text-slate-400">
              נרשמה ב־{createdAt.toLocaleDateString('he-IL')}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <form action={approveAction} className="flex items-center justify-between gap-3">
          <input type="hidden" name="profileId" value={profile.id} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>תפקיד:</span>
            <select
              name="role"
              defaultValue={profile.role}
              className="border border-slate-200 rounded-xl px-3 h-11 text-sm bg-white"
            >
              <option value="yoledet">יולדת</option>
              <option value="cook">מבשלת</option>
              <option value="deliverer">מחלקת</option>
            </select>
          </label>

          <button
            type="submit"
            className="min-h-[48px] px-5 rounded-full bg-[#91006A] text-white text-sm font-semibold active:opacity-80"
          >
            אישור
          </button>
        </form>

        {profile.role === 'yoledet' && (
          <form
            action={toggleShabbatAction}
            className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-1"
          >
            <input type="hidden" name="profileId" value={profile.id} />
            <input
              type="hidden"
              name="enabled"
              value={profile.shabbat_enabled ? 'false' : 'true'}
            />
            <div className="flex flex-col text-right text-sm">
              <span className="font-medium text-slate-800">זכאות לארוחות שבת</span>
              <span className="text-xs text-slate-500">
                {profile.shabbat_enabled ? 'מופעל' : 'כבוי'}
              </span>
            </div>
            <button
              type="submit"
              className="min-h-[40px] px-4 rounded-full border border-slate-300 text-sm font-medium text-slate-700 bg-slate-50 active:opacity-80"
            >
              {profile.shabbat_enabled ? 'ביטול זכאות' : 'הפעלת זכאות'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

