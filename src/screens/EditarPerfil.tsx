import { useEffect, useRef, useState } from 'react';
import type { Screen, UserData } from '../types';
import { AppLayout } from '../components/Nav';
import Avatar from '../components/Avatar';
import { ArrowLeftIcon, CameraIcon, CheckCircleIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import { toSquareJpeg } from '../lib/image';
import { personNameError, phoneError, squish } from '../lib/validation';

interface Props {
  user: UserData;
  navigate: (s: Screen) => void;
  /** photo: nova imagem (data URL), null para remover ou undefined para manter. Retorna mensagem de erro. */
  onSave: (patch: { name: string; phone?: string; sector?: string; photo?: string | null }) => Promise<string | null>;
}

const SECTORS = ['Setor Central', 'Setor Norte', 'Setor Sul', 'Setor Leste', 'Setor Oeste', 'Ponte Alta', 'Engenho das Lajes', 'Setor de Indústria'];
const MAX_UPLOAD = 8 * 1024 * 1024;

const maskPhone = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');

export default function EditarPerfil({ user, navigate, onSave }: Props) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [sector, setSector] = useState(user.sector ?? '');
  const [photo, setPhoto] = useState<string | undefined>(user.photo);
  const [photoError, setPhotoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Depois de salvar, adota o perfil devolvido pelo servidor (a foto vira o link do Storage).
  useEffect(() => {
    if (!saved) return;
    setName(user.name);
    setPhone(user.phone ?? '');
    setSector(user.sector ?? '');
    setPhoto(user.photo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, saved]);

  const dirty = name.trim() !== user.name || phone !== (user.phone ?? '') || sector !== (user.sector ?? '') || photo !== user.photo;

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    if (!file.type.startsWith('image/')) return setPhotoError('Escolha um arquivo de imagem (JPG, PNG ou WebP).');
    if (file.size > MAX_UPLOAD) return setPhotoError('A imagem deve ter no máximo 8 MB.');
    setProcessing(true);
    try {
      setPhoto(await toSquareJpeg(file));
      setSaved(false);
    } catch {
      setPhotoError('Não foi possível ler essa imagem. Tente outra.');
    } finally {
      setProcessing(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const nameErr = personNameError(name);
    if (nameErr) er.name = nameErr;
    const phoneErr = phoneError(phone);
    if (phoneErr) er.phone = phoneErr;
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const err = await onSave({
      name: squish(name),
      phone: phone || undefined,
      sector: sector || undefined,
      photo: photo === user.photo ? undefined : photo ?? null,
    });
    setSaving(false);
    if (err) return setErrors({ form: err });
    setSaved(true);
  }

  const field = (k: string) =>
    `w-full h-12 px-4 rounded-xl border text-sm font-body outline-none transition-all bg-white ${
      errors[k] ? 'border-red-400 ring-2 ring-red-100' : 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100 hover:border-eco-300'
    }`;

  return (
    <AppLayout screen="editarPerfil" navigate={navigate}>
      <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('perfil')} aria-label="Voltar ao perfil" className="p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50 transition-colors">
            <ArrowLeftIcon size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Editar perfil</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Suas informações no Ecópolis</p>
          </div>
        </div>

        <form noValidate onSubmit={save} className="space-y-5">
          {/* Foto */}
          <section className="bg-white rounded-2xl border border-eco-100 p-5 flex items-center gap-5">
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Escolher foto" className="relative flex-shrink-0 group">
              <Avatar user={{ name: name || user.name, photo }} className="w-24 h-24 rounded-3xl text-white bg-gradient-to-br from-eco-500 to-eco-800" textClassName="text-3xl" />
              <span className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-eco-800 text-white flex items-center justify-center shadow-md ring-2 ring-white group-hover:scale-110 transition-transform">
                <CameraIcon size={15} />
              </span>
              {processing && <span className="absolute inset-0 rounded-3xl bg-white/70 flex items-center justify-center text-xs font-body text-eco-700">Ajustando…</span>}
            </button>
            <div className="min-w-0">
              <div className="font-display font-semibold text-eco-900 text-sm">Foto do perfil</div>
              <p className="text-xs text-eco-500 font-body mt-0.5 mb-3">JPG, PNG ou WebP, até 8 MB. A foto é recortada em quadrado.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="h-9 px-4 rounded-xl bg-eco-800 text-white text-xs font-display font-semibold hover:bg-eco-900 transition-colors">
                  {photo ? 'Trocar foto' : 'Enviar foto'}
                </button>
                {photo && (
                  <button type="button" onClick={() => { setPhoto(undefined); setSaved(false); }} className="h-9 px-4 rounded-xl border border-eco-200 text-eco-700 text-xs font-display font-semibold hover:bg-eco-50 transition-colors">
                    Remover
                  </button>
                )}
              </div>
              {photoError && <p className="text-red-500 text-xs mt-2">{photoError}</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={pickPhoto} className="sr-only" aria-label="Arquivo da foto" />
          </section>

          {/* Dados */}
          <section className="bg-white rounded-2xl border border-eco-100 p-5 space-y-4">
            <p className="text-[11px] text-eco-500 font-body"><Req /> Campos obrigatórios</p>
            <div>
              <label htmlFor="pf-name" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nome completo<Req /></label>
              <input id="pf-name" value={name} autoComplete="name" onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); setSaved(false); }} className={field('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="pf-email" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">E-mail</label>
              <input id="pf-email" value={user.email} readOnly className="w-full h-12 px-4 rounded-xl border border-eco-100 bg-eco-50 text-sm font-body text-eco-500 outline-none" />
              <p className="text-[11px] text-eco-400 font-body mt-1">O e-mail é usado para entrar e não pode ser alterado aqui.</p>
            </div>
            <div>
              <label htmlFor="pf-phone" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Telefone <span className="font-normal text-eco-400">(opcional)</span></label>
              <input id="pf-phone" value={phone} inputMode="tel" autoComplete="tel" placeholder="(61) 90000-0000" onChange={(e) => { setPhone(maskPhone(e.target.value)); setErrors((p) => ({ ...p, phone: '' })); setSaved(false); }} className={field('phone')} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="pf-sector" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Setor onde mora <span className="font-normal text-eco-400">(opcional)</span></label>
              <select id="pf-sector" value={sector} onChange={(e) => { setSector(e.target.value); setSaved(false); }} className={field('sector')}>
                <option value="">Prefiro não informar</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </section>

          {errors.form && <p role="alert" className="text-red-500 text-sm font-body bg-red-50 rounded-xl px-4 py-3">{errors.form}</p>}
          {saved && !dirty && (
            <p role="status" className="flex items-center gap-2 text-sm font-body text-eco-700 bg-eco-50 border border-eco-100 rounded-xl px-4 py-3">
              <CheckCircleIcon size={16} className="text-eco-600" /> Perfil atualizado.
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('perfil')} className="flex-1 h-12 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50 transition-colors">
              {saved && !dirty ? 'Voltar' : 'Cancelar'}
            </button>
            <button type="submit" disabled={!dirty || processing || saving} className="flex-1 h-12 rounded-xl text-white text-sm font-display font-semibold disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
