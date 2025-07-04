import jsPDF from 'jspdf';
import { getApiUrl } from '@/utils/apiConfig';

interface GenerateLabelsParams {
  type: 'partituras' | 'performances';
  fields: string[];
}

const fieldLabels = {
  partituras: {
    setor: 'Setor',
    titulo: 'Título',
    compositor: 'Compositor',
    instrumentacao: 'Instrumentação',
    tonalidade: 'Tonalidade',
    genero: 'Gênero/Forma',
    edicao: 'Edição',
    ano_edicao: 'Ano da Edição',
    digitalizado: 'Digitalizado',
    numero_armario: 'N° Armário',
    numero_prateleira: 'N° Prateleira',
    numero_pasta: 'N° Pasta',
    instituicao: 'Instituição',
    observacoes: 'Observações',
  },
  performances: {
    titulo_obra: 'Título da Obra',
    nome_compositor: 'Compositor',
    local: 'Local',
    data: 'Data',
    horario: 'Horário',
    maestros: 'Maestro(s)',
    interpretes: 'Intérprete(s)',
    release: 'Release',
  }
};

// Função para obter o token do localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Função para fazer requisições autenticadas
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido, fazer logout
      localStorage.removeItem('auth_token');
      throw new Error('Sessão expirada');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro na requisição');
  }

  return response;
};

export const generateLabels = async ({ type, fields }: GenerateLabelsParams) => {
  console.log('Generating labels:', { type, fields });
  
  try {
    // Buscar dados da API REST
    const res = await authenticatedFetch(`${getApiUrl()}/api/${type}`);
    const data = await res.json();
    
    console.log('Data fetched for labels:', data);
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Configurações da etiqueta (compatível com Pimaco)
    const labelWidth = 50;
    const labelHeight = 25;
    const marginLeft = 10;
    const marginTop = 15;
    const spacingX = 15;
    const spacingY = 5;
    const labelsPerRow = 3;
    const labelsPerColumn = 10;
    
    let currentLabel = 0;
    
    data.forEach((item: any) => {
      if (currentLabel >= labelsPerRow * labelsPerColumn) {
        doc.addPage();
        currentLabel = 0;
      }
      
      const row = Math.floor(currentLabel / labelsPerRow);
      const col = currentLabel % labelsPerRow;
      
      const x = marginLeft + col * (labelWidth + spacingX);
      const y = marginTop + row * (labelHeight + spacingY);
      
      // Desenhar borda da etiqueta
      doc.setLineWidth(0.1);
      doc.rect(x, y, labelWidth, labelHeight);
      
      // Adicionar conteúdo da etiqueta
      let lineY = y + 4;
      const lineHeight = 3;
      doc.setFontSize(8);
      
      fields.forEach((field) => {
        if (lineY + lineHeight > y + labelHeight - 2) return; // Não ultrapassar a etiqueta
        
        const value = item[field as keyof typeof item];
        const fieldLabel = fieldLabels[type][field as keyof typeof fieldLabels[typeof type]] || field;
        let text = '';
        
        if (field === 'digitalizado') {
          text = `${fieldLabel}: ${value ? 'Sim' : 'Não'}`;
        } else if (field === 'data') {
          text = `${fieldLabel}: ${new Date(value as string).toLocaleDateString('pt-BR')}`;
        } else {
          const displayValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
          text = `${fieldLabel}: ${displayValue}`;
        }
        
        // Truncar texto se for muito longo
        const maxWidth = labelWidth - 4;
        const truncatedText = doc.getTextWidth(text) > maxWidth 
          ? text.substring(0, Math.floor(text.length * maxWidth / doc.getTextWidth(text))) + '...'
          : text;
        
        doc.text(truncatedText, x + 2, lineY);
        lineY += lineHeight;
      });
      
      currentLabel++;
    });
    
    doc.save(`etiquetas_${type}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('Error generating labels:', error);
    throw error;
  }
};
