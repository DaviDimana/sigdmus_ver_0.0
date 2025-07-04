import { instrumentList } from './instrumentList';

/**
 * Identifica o instrumento com base no nome do arquivo.
 * Compara o nome do arquivo com uma lista de instrumentos conhecidos.
 * 
 * @param fileName O nome do arquivo a ser analisado.
 * @returns O código do instrumento (ex: 'VIOLINO') se encontrado, ou null.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/s\b/g, '') // remove plural simples no final de palavra
    .replace(/\s+/g, '');
}

export function identifyInstrument(fileName: string): string | null {
  if (!fileName) return null;

  const normFileName = normalize(fileName);

  // Mapeamento de sinônimos ou variações para o valor padrão
  const aliasMap: Record<string, string> = {
    'flute': 'FLAUTA',
    'fl': 'FLAUTA',
    'fls': 'FLAUTA',
    'flautas': 'FLAUTA',
    'picc': 'FLAUTA',
    'piccolo': 'FLAUTA',
    'oboe': 'OBOE',
    'oboes': 'OBOE',
    'ob': 'OBOE',
    'cl': 'CLARINETE',
    'clt': 'CLARINETE',
    'clarinet': 'CLARINETE',
    'clarinets': 'CLARINETE',
    'clarone': 'CLARINETE',
    'requinta': 'CLARINETE',
    'cls': 'CLARINETE',
    'bass clarinet': 'CLARINETE',
    'bn': 'FAGOTE',
    'bsn': 'FAGOTE',
    'bassoon': 'FAGOTE',
    'fagotes': 'FAGOTE',
    'fg': 'FAGOTE',
    'horn': 'TROMPA',
    'horns': 'TROMPA',
    'cor': 'TROMPA',
    'cors': 'TROMPA',
    'corno': 'TROMPA',
    'corni': 'TROMPA',
    'trompa': 'TROMPA',
    'trompas': 'TROMPA',
    'trumpet': 'TROMPETE',
    'trumpets': 'TROMPETE',
    'tpt': 'TROMPETE',
    'tpts': 'TROMPETE',
    'tromba': 'TROMPETE',
    'trombone': 'TROMBONE',
    'trombones': 'TROMBONE',
    'tbn': 'TROMBONE',
    'tbns': 'TROMBONE',
    'posaune': 'TROMBONE',
    'tuba': 'TUBA',
    'tubas': 'TUBA',
    'tba': 'TUBA',
    'vln': 'VIOLINO',
    'vl': 'VIOLINO',
    'vlns': 'VIOLINO',
    'vl1': 'VIOLINO',
    'vl2': 'VIOLINO',
    'violin': 'VIOLINO',
    'violins': 'VIOLINO',
    'violin1': 'VIOLINO',
    'violin2': 'VIOLINO',
    'v1': 'VIOLINO',
    'v2': 'VIOLINO',
    'vla': 'VIOLA',
    'viola': 'VIOLA',
    'violas': 'VIOLA',
    'bratsche': 'VIOLA',
    'va': 'VIOLA',
    'vc': 'VIOLONCELO',
    'vcs': 'VIOLONCELO',
    'cello': 'VIOLONCELO',
    'cellos': 'VIOLONCELO',
    'violoncelo': 'VIOLONCELO',
    'violoncelos': 'VIOLONCELO',
    'cb': 'CONTRABAIXO',
    'cbx': 'CONTRABAIXO',
    'contrabass': 'CONTRABAIXO',
    'contrabaixo': 'CONTRABAIXO',
    'contrabaixos': 'CONTRABAIXO',
    'bass': 'CONTRABAIXO',
    'bassi': 'CONTRABAIXO',
    'harp': 'HARPA',
    'harpa': 'HARPA',
    'harpas': 'HARPA',
    'pno': 'PIANO',
    'piano': 'PIANO',
    'timpani': 'TIMPANOS',
    'timp': 'TIMPANOS',
    'timpanos': 'TIMPANOS',
    'percussion': 'PERCUSSAO',
    'perc': 'PERCUSSAO',
    'percussao': 'PERCUSSAO',
    'percussões': 'PERCUSSAO',
    'bass drum': 'PERCUSSAO',
    'sax': 'OUTRO',
    'saxofone': 'OUTRO',
    'saxophone': 'OUTRO',
    'saxofones': 'OUTRO',
    'saxophones': 'OUTRO',
    'soprano': 'SOPRANO',
    'contralto': 'CONTRALTO',
    'tenor': 'TENOR',
    'baixo': 'BAIXO',
    'score': 'PARTITURA',
    'maestro': 'PARTITURA',
    'grade': 'PARTITURA',
    'partitura': 'PARTITURA',
    'partitura completa': 'PARTITURA_COMPLETA',
    'outro': 'OUTRO',
  };

  // Primeiro, verifica os aliases (normalizados)
  for (const alias in aliasMap) {
    if (normFileName.includes(normalize(alias))) {
      return aliasMap[alias];
    }
  }

  // Se não encontrar em aliases, verifica a lista principal pelo 'label' (normalizado)
  for (const instrument of instrumentList) {
    const normLabel = normalize(instrument.label);
    // Aceita plural simples também
    if (normFileName.includes(normLabel) || normFileName.includes(normLabel + 's')) {
      return instrument.value;
    }
  }

  return null;
} 