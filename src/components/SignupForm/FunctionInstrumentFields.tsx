import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface FunctionInstrumentFieldsProps {
  formData: {
    funcao: string;
    instrumento: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  funcoes: Array<{ value: string; label: string }>;
}

export const instrumentos = [
  { value: 'FLAUTA', label: 'Flauta' },
  { value: 'OBOÉ', label: 'Oboé' },
  { value: 'CLARINETE', label: 'Clarinete' },
  { value: 'FAGOTE', label: 'Fagote' },
  { value: 'TROMPA', label: 'Trompa' },
  { value: 'TROMPETE', label: 'Trompete' },
  { value: 'TROMBONE', label: 'Trombone' },
  { value: 'TUBA', label: 'Tuba' },
  { value: 'VIOLINO_I', label: 'Violino I' },
  { value: 'VIOLINO_II', label: 'Violino II' },
  { value: 'VIOLA', label: 'Viola' },
  { value: 'VIOLONCELO', label: 'Violoncelo' },
  { value: 'CONTRABAIXO', label: 'Contrabaixo' },
  { value: 'HARPA', label: 'Harpa' },
  { value: 'PIANO', label: 'Piano' },
  { value: 'PERCUSSAO', label: 'Percussão' },
  { value: 'SOPRANO', label: 'Soprano' },
  { value: 'CONTRALTO', label: 'Contralto' },
  { value: 'TENOR', label: 'Tenor' },
  { value: 'BAIXO', label: 'Baixo' }
];

const FunctionInstrumentFields: React.FC<FunctionInstrumentFieldsProps> = ({ formData, setFormData, funcoes }) => {
  const needsInstrument = ['MUSICO', 'ESTUDANTE', 'PROFESSOR'].includes(formData.funcao);
  const cannotHaveInstrument = ['MAESTRO', 'ARQUIVISTA', 'GERENTE'].includes(formData.funcao);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="funcao">Função *</Label>
        <Select
          value={formData.funcao}
          onValueChange={(value) => {
            setFormData(prev => ({ 
              ...prev, 
              funcao: value,
              instrumento: cannotHaveInstrument ? '' : prev.instrumento
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione sua função" />
          </SelectTrigger>
          <SelectContent>
            {funcoes.map((funcao) => (
              <SelectItem key={funcao.value} value={funcao.value}>
                {funcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instrumento">Instrumento</Label>
        {cannotHaveInstrument ? (
          <Input value="—" disabled className="bg-gray-100" />
        ) : (
          <Select
            value={formData.instrumento}
            onValueChange={(value) => setFormData(prev => ({ ...prev, instrumento: value }))}
            disabled={!needsInstrument}
          >
            <SelectTrigger>
              <SelectValue placeholder={needsInstrument ? "Selecione seu instrumento" : "—"} />
            </SelectTrigger>
            <SelectContent>
              {instrumentos.map((inst) => (
                <SelectItem key={inst.value} value={inst.value}>
                  {inst.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default FunctionInstrumentFields;
