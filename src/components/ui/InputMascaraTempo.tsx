import { useState } from 'react';
import { Input } from './Input';
import { mascaraTempo, parseTempo } from '../../utils/medalhas';

interface Props {
  id?: string;
  valor: string;
  onMudar: (tempo: number | undefined) => void;
  placeholder?: string;
  className?: string;
  erro?: boolean;
  disabled?: boolean;
}

export function InputMascaraTempo({
  id,
  valor,
  onMudar,
  placeholder,
  className,
  erro,
  disabled,
}: Props) {
  const [exibido, setExibido] = useState(valor);

  return (
    <Input
      id={id}
      value={exibido}
      onChange={(evento) => {
        const mascarado = mascaraTempo(evento.target.value);
        setExibido(mascarado);
        onMudar(parseTempo(mascarado));
      }}
      placeholder={placeholder ?? "00''00"}
      inputMode="numeric"
      aria-label="Tempo"
      className={`font-mono tabular-nums w-24 ${className ?? ''}`}
      erro={erro}
      disabled={disabled}
    />
  );
}
