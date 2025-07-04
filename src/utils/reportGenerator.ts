import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { getApiUrl } from '@/utils/apiConfig';

interface GenerateReportParams {
  type: 'partituras' | 'performances';
  fields: string[];
  format: 'pdf' | 'word' | 'excel';
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

export const generateReport = async ({ type, fields, format }: GenerateReportParams) => {
  console.log('Generating report:', { type, fields, format });
  
  try {
    // Buscar dados da API REST
    const res = await authenticatedFetch(`${getApiUrl()}/api/${type}`);
    const data = await res.json();
    
    console.log('Data fetched for report:', data);
    
    const currentFieldLabels = fieldLabels[type];
    const headers = fields.map(field => currentFieldLabels[field as keyof typeof currentFieldLabels] || field);
    const rows = data.map((item: any) => 
      fields.map(field => {
        const value = item[field as keyof typeof item];
        if (field === 'digitalizado') {
          return value ? 'Sim' : 'Não';
        }
        if (field === 'data') {
          return new Date(value as string).toLocaleDateString('pt-BR');
        }
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      })
    );

    switch (format) {
      case 'pdf':
        generatePDFReport(headers, rows, type);
        break;
      case 'word':
        generateWordReport(headers, rows, type);
        break;
      case 'excel':
        generateExcelReport(headers, rows, type);
        break;
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

const generatePDFReport = (headers: string[], rows: string[][], type: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(`Relatório de ${type === 'partituras' ? 'Partituras' : 'Performances'}`, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { top: 40 }
  });

  doc.save(`relatorio_${type}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const generateWordReport = async (headers: string[], rows: string[][], type: string) => {
  const tableRows = [
    new TableRow({
      children: headers.map(header => 
        new TableCell({
          children: [new Paragraph(header)],
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
        })
      )
    }),
    ...rows.map(row => 
      new TableRow({
        children: row.map(cell => 
          new TableCell({
            children: [new Paragraph(cell)],
            width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
          })
        )
      })
    )
  ];

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: `Relatório de ${type === 'partituras' ? 'Partituras' : 'Performances'}`,
          heading: 'Heading1'
        }),
        new Paragraph({
          text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
        }),
        new Paragraph(''),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  saveAs(new Blob([buffer]), `relatorio_${type}_${new Date().toISOString().slice(0, 10)}.docx`);
};

const generateExcelReport = (headers: string[], rows: string[][], type: string) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(wb, ws, type === 'partituras' ? 'Partituras' : 'Performances');
  
  XLSX.writeFile(wb, `relatorio_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
