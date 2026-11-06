import type { UserData } from '../types';

interface Props {
  user: Pick<UserData, 'name' | 'photo'>;
  className?: string;
  textClassName?: string;
}

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Foto do perfil ou iniciais do nome. O tamanho e o fundo vêm de `className`. */
export default function Avatar({ user, className = '', textClassName = '' }: Props) {
  return (
    <div className={`overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}>
      {user.photo ? (
        <img src={user.photo} alt={`Foto de ${user.name}`} className="w-full h-full object-cover" />
      ) : (
        <span className={`font-display font-bold ${textClassName}`} aria-hidden="true">{initials(user.name)}</span>
      )}
    </div>
  );
}
