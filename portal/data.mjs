import * as XLSX from 'xlsx/xlsx.mjs';
export const columns=[['item','Item'],['name','Nome'],['cpf','CPF'],['birth','Data de nascimento'],['marital','Estado civil'],['relationship','Vínculo'],['holderCpf','CPF do titular'],['group','Grupo'],['death','Morte'],['iea','IEA'],['ipa','Invalidez por acidente'],['ifpd','Invalidez por doença'],['funeral','Funeral'],['funeralType','Tipo de funeral'],['cost','Custo'],['start','Início individual'],['end','Fim individual']];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function cpfValid(value){const s=String(value).replace(/\D/g,'');if(!/^\d{11}$/.test(s)||/^(\d)\1+$/.test(s))return false;for(let j=9;j<11;j++){let v=0;for(let i=0;i<j;i++)v+=Number(s[i])*(j+1-i);v=(v*10)%11;if(v===10)v=0;if(v!==Number(s[j]))return false;}return true;}
const date=s=>{if(s===null||s===undefined||s==='')return '';if(s instanceof Date)return s.toISOString().slice(0,10);if(typeof s==='number'){const d=XLSX.SSF.parse_date_code(s);if(!d)return '!';return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}s=String(s).trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(s))s=s.split('/').reverse().join('-');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s?s:'!';};
function money(v){if(v===''||v==null)return null;if(typeof v==='string'){v=v.replace(/R\$|\s/g,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');}const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1e10?Math.round(n*100)/100:NaN;}
export function parseRows(input,month){
 if(!Array.isArray(input)||input.length>5000)throw Error('A relação deve ter até 5.000 linhas.');
 const seen=new Set(),items=new Set(),rows=[];
 for(const [ix,raw]of input.entries()){
  const o={};for(const [key]of columns)o[key]=raw[key]??'';
  o.name=String(o.name).trim();o.item=String(o.item).trim();o.cpf=String(o.cpf).replace(/\D/g,'');o.holderCpf=String(o.holderCpf).replace(/\D/g,'');
  if(!o.name||!o.item||!cpfValid(o.cpf))throw Error(`Linha ${ix+2}: informe item, nome e CPF válido.`);
  if(seen.has(o.cpf)||items.has(o.item))throw Error(`Linha ${ix+2}: CPF ou item duplicado.`);seen.add(o.cpf);items.add(o.item);
  o.birth=date(o.birth);o.start=date(o.start);o.end=date(o.end);
  if(!o.birth||o.birth==='!'||o.birth>month+'-31'||!o.start||o.start==='!'||o.end==='!'||(o.end&&o.end<o.start))throw Error(`Linha ${ix+2}: confira nascimento e vigência individual.`);
  const rel=norm(o.relationship);o.relationship=({titular:'Titular',conjuge:'Cônjuge',filho:'Filho',filha:'Filho'})[rel];if(!o.relationship)throw Error(`Linha ${ix+2}: vínculo deve ser Titular, Cônjuge ou Filho.`);
  if(o.relationship!=='Titular'&&(!cpfValid(o.holderCpf)||o.holderCpf===o.cpf))throw Error(`Linha ${ix+2}: informe CPF válido do titular do dependente.`);
  const ft=norm(o.funeralType);o.funeralType=({familiar:'Familiar',individual:'Individual',naocontratado:'Não contratado','':'Não informado',naoinformado:'Não informado'})[ft];if(!o.funeralType)throw Error(`Linha ${ix+2}: tipo de funeral inválido.`);
  for(const k of ['death','iea','ipa','ifpd','funeral','cost']){o[k]=money(o[k]);if(Number.isNaN(o[k]))throw Error(`Linha ${ix+2}: valor inválido em ${k}.`);}
  for(const k of ['marital','group'])o[k]=String(o[k]).trim().slice(0,160);
  if(!o.marital)throw Error(`Linha ${ix+2}: informe estado civil ou Não informado.`);
  if(o.name.length>200||o.item.length>60)throw Error('Nome ou item muito longo.');rows.push(o);
 }
 for(const r of rows)if(r.relationship!=='Titular'&&!rows.some(t=>t.cpf===r.holderCpf&&t.relationship==='Titular'))throw Error('Dependente sem titular na relação completa.');
 return rows;
}
export function validateZip(bytes){
 // Inspect central-directory uncompressed sizes before the parser allocates memory.
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Arquivo Excel inválido. Utilize XLSX ou XLSM.');
 const count=v.getUint16(end+10,true);let pos=v.getUint32(end+16,true),total=0;if(count>2000)throw Error('Arquivo com excesso de componentes.');
 for(let i=0;i<count;i++){if(pos+46>bytes.length||v.getUint32(pos,true)!==0x02014b50)throw Error('Estrutura Excel inválida.');total+=v.getUint32(pos+24,true);if(total>30*1024*1024)throw Error('Arquivo descompactado excede 30 MB.');pos+=46+v.getUint16(pos+28,true)+v.getUint16(pos+30,true)+v.getUint16(pos+32,true);}
}
export function parseWorkbook(bytes,month){validateZip(bytes);const wb=XLSX.read(bytes,{type:'array',cellDates:false,sheetRows:5002,cellFormula:false,bookVBA:false});for(const name of wb.SheetNames){const a=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});if(!a.length)continue;const h=a[0].map(norm);if(!h.includes('cpf')||!h.includes('nome'))continue;const mapped=a.slice(1).filter(r=>r.some(v=>v!==''&&v!=null)).map(r=>Object.fromEntries(columns.map(([k,label])=>[k,r[h.indexOf(norm(label))]??''])));return parseRows(mapped,month);}throw Error('Arquivo recebido sem relação no modelo padrão. A Originalli precisa conferir e enviar a relação completa no modelo do portal.');}
export function workbook(rows,policy,month,template=false){const wb=XLSX.utils.book_new();const data=[columns.map(c=>c[1]),...rows.map(r=>columns.map(([k])=>r[k]??''))];const ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=columns.map(([k])=>({wch:k==='name'?38:22}));if(rows.length)ws['!autofilter']={ref:ws['!ref']};XLSX.utils.book_append_sheet(wb,ws,'Segurados');const metadata=[['ORIGINALLI — VIDA EM GRUPO'],['Razão social',policy.company_name],['Seguradora',policy.insurer],['Número de apólice',policy.number||'Pendente de emissão/confirmação'],['Competência',month],['Tipo',template?'MODELO DE RELAÇÃO COMPLETA':'RELAÇÃO CONFERIDA NO PORTAL'],['Instruções','Uma linha por pessoa. Titular, Cônjuge ou Filho. Datas AAAA-MM-DD.'],['Dependentes','Informar CPF do titular. Funeral familiar não cria dependentes automaticamente.'],['Valores','Número zero significa sem capital/custo; célula vazia significa não informado.'],['Vigência','Início e fim individual inclusivos. Não remover pessoas sem informar a data de saída.'],['Conferência','A relação só será publicada após conferência da Originalli.']];XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(metadata),'Identificação');return XLSX.write(wb,{type:'array',bookType:'xlsx'});}
export function activeRows(rows,month){const last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);return rows.filter(r=>r.start<=last&&(!r.end||r.end>=month+'-01'));}
