import { insuranceLibrary, libraryBody } from './library-content.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { publicDir } from '../server/paths.mjs';
import { centralBody } from './central-content.mjs';

const dist = publicDir;

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function head(title, description, extraCss) {
  return [
    '<!doctype html>',
    "<html lang='pt-BR'>",
    '<head>',
    "  <meta charset='utf-8'>",
    "  <meta name='viewport' content='width=device-width, initial-scale=1'>",
    "  <meta name='theme-color' content='#0b2340'>",
    "  <meta name='description' content='" + esc(description) + "'>",
    '  <title>' + esc(title) + '</title>',
    "  <script>document.documentElement.classList.add('js')</script>",
    "  <link rel='icon' type='image/svg+xml' href='../assets/favicon.svg'>",
    "  <link rel='stylesheet' href='../styles.css?v=16'>",
    extraCss ? "  <link rel='stylesheet' href='../" + extraCss + "?v=16'>" : '',
    "  <link rel='stylesheet' href='../updates.css?v=16'>",
    '</head>',
    "<body class='inner-page'>",
    "  <a class='skip-link' href='#conteudo'>Ir para o conteúdo</a>"
  ].filter(Boolean).join('\n');
}

function header() { return "<header class=\"site-header header-organized\" id=\"inicio\">\n<div class=\"utility-bar\"><div class=\"container utility-inner\"><span>Atendimento nacional · Londrina/PR</span><div class=\"utility-links\"><a href=\"tel:+554333759800\">(43) 3375-9800</a></div></div></div>\n<nav class=\"main-nav\" aria-label=\"Navegação principal\"><div class=\"container nav-inner\">\n<a class=\"brand\" href=\"/\" aria-label=\"Originalli — início\"><img src=\"/assets/originalli-logo.svg\" alt=\"Originalli Corretora de Seguros\" width=\"260\" height=\"63\"></a>\n<div class=\"header-actions\"><a href=\"https://originalli.com.br/tela-de-login\" class=\"header-action \">Área do cliente</a><a href=\"/vida-grupo/\" class=\"header-action \">Vida em Grupo · RH</a><a href=\"/contrate-online/\" class=\"header-action action-primary\">Calcule on-line</a><a href=\"/contato/\" class=\"header-action \">Contato</a></div>\n<button class=\"menu-toggle\" type=\"button\" aria-expanded=\"false\" aria-controls=\"menu-principal\"><span class=\"menu-label\">Menu</span><span class=\"menu-icon\" aria-hidden=\"true\"><i></i><i></i></span></button>\n<div class=\"nav-links nav-links-wide\" id=\"menu-principal\"><a href=\"/\">Início</a><a href=\"/quem-somos/\">Quem somos</a><a href=\"/solucoes/\">Soluções</a><a href=\"/empresas/\">Empresas</a><a href=\"/pessoas/\">Pessoas</a><a href=\"/seguradoras/\">Seguradoras</a><a href=\"/biblioteca-seguros/\">Biblioteca</a><a href=\"/central-originalli/\">Central de atendimento</a><a class=\"mobile-service\" href=\"https://originalli.com.br/tela-de-login\">Área do cliente</a><a class=\"mobile-service\" href=\"/vida-grupo/\">Vida em Grupo · RH</a><a class=\"mobile-service\" href=\"/contrate-online/\">Calcule on-line</a><a class=\"mobile-service\" href=\"/contato/\">Contato</a></div></div></nav></header>"; }

function footer() {
  return [
    "  <footer class='site-footer landing-footer'>",
    "    <div class='container footer-main'><div class='footer-brand'><img src='../assets/originalli-logo.svg' alt='Originalli Corretora de Seguros' width='250' height='60'><p>Administração de patrimônio, consultoria securitária e gerenciamento de riscos para pessoas e empresas.</p></div>",
    "    <div class='footer-nav'><span>Navegue</span><a href='../quem-somos/'>Quem somos</a><a href='../solucoes/'>Soluções</a><a href='../biblioteca-seguros/'>Biblioteca</a><a href='../empresas/'>Empresas</a><a href='../pessoas/'>Pessoas</a><a href='../seguradoras/'>Seguradoras</a></div>",
    "    <div class='footer-nav'><span>Acesso</span><a href='/vida-grupo/'>Manutenção de Vida em Grupo</a><a href='../contrate-online/'>Contrate on-line</a><a href='https://originalli.com.br/tela-de-login'>Área do cliente ↗</a><a href='https://www.instagram.com/originalli.seguros/' target='_blank' rel='noopener'>Instagram ↗</a><a href='https://www.facebook.com/originalli.seguros' target='_blank' rel='noopener'>Facebook ↗</a></div></div>",
    "    <div class='container footer-bottom'><span>© <span id='current-year'>2026</span> Originalli Corretora de Seguros.</span><span>Atendimento humano. Proteção inteligente.</span></div>",
    '  </footer>',
    "  <div class='mobile-actions' aria-label='Canais rápidos'><a href='../contrate-online/'>Calcular</a><a href='https://wa.me/554333759800' target='_blank' rel='noopener'>WhatsApp</a><a href='../central-originalli/#emergencia'>Emergência</a></div>",
    "  <script src='../app.js?v=17' defer></script>",
    '</body>',
    '</html>'
  ].join('\n');
}

function innerHero(kicker, title, lead, actionLabel, actionHref) {
  const action = actionLabel ? "<a class='button button-primary' href='" + actionHref + "' data-track='inner_hero'>" + actionLabel + "</a>" : '';
  return [
    "  <section class='inner-hero'><div class='container inner-hero-content reveal'>",
    "    <p class='breadcrumb'><a href='../'>Início</a><span>›</span>" + esc(kicker) + '</p>',
    "    <p class='eyebrow'><span></span>" + esc(kicker) + '</p>',
    '    <h1>' + esc(title) + '</h1>',
    "    <p class='inner-hero-lead'>" + esc(lead) + '</p>',
    '    ' + action,
    '  </div></section>'
  ].join('\n');
}

function visualHero(image, alt, summary, label, href) {
  return [
    "  <section class='inner-visual-hero'><div class='container'><div class='inner-banner reveal'>",
    "    <h1 class='sr-only'>" + esc(alt) + '</h1>',
    "    <img src='../assets/" + image + "' alt='" + esc(alt) + "' width='1384' height='738'>",
    "    <div class='inner-banner-action'><p>" + esc(summary) + "</p><a class='button button-primary' href='" + href + "' data-track='visual_hero'>" + esc(label) + '</a></div>',
    '  </div></div></section>'
  ].join('\n');
}

function leadForm(context, interest, includeInterestSelect) {
  const interestField = includeInterestSelect
    ? "<label><span>Seguro ou solução</span><select name='interesse' required><option value='' selected disabled>Selecione</option><option>Seguro de vida individual</option><option>Seguro de vida corporativo</option><option>Seguro saúde corporativo</option><option>Seguro de transporte — embarcador</option><option>Seguro de transporte — transportador</option><option>Responsabilidade civil geral</option><option>Responsabilidade civil profissional</option><option>Seguro patrimonial empresarial</option><option>Seguro de frotas</option><option>Seguro de equipamentos agrícolas</option><option>Seguro de máquinas linha amarela</option><option>Seguro residencial</option><option>Seguro condomínio</option><option>Consultoria securitária e gestão de riscos</option><option>Seguro automóvel</option><option>Seguro moto</option><option>Seguro caminhão</option><option>Outro risco</option></select></label>"
    : "<input type='hidden' name='interesse' value='" + esc(interest) + "'>";
  return [
    "<form class='contact-form' id='whatsapp-form' data-form-context='" + esc(context) + "'>",
    "  <div class='form-heading'><span>Solicite uma análise</span><p>Você continua o atendimento pelo WhatsApp.</p></div>",
    "  <label><span>Seu nome</span><input type='text' name='nome' autocomplete='name' required placeholder='Como podemos chamar você?'></label>",
    "  <label><span>Perfil</span><select name='perfil' required><option value='' selected disabled>Selecione</option><option>Pessoa física</option><option>Empresa</option><option>Síndico ou administradora</option><option>Produtor rural</option><option>Transportador ou embarcador</option></select></label>",
    '  ' + interestField,
    "  <div class='form-row'><label><span>Telefone</span><input type='tel' name='telefone' autocomplete='tel' inputmode='tel' required placeholder='(00) 00000-0000'></label><label><span>Cidade/UF</span><input type='text' name='cidade' autocomplete='address-level2' placeholder='Ex.: Londrina/PR'></label></div>",
    "  <button class='button button-primary form-submit' type='submit'>Continuar pelo WhatsApp<svg aria-hidden='true' viewBox='0 0 24 24'><path d='M5 12h14M13 6l6 6-6 6'/></svg></button>",
    '  <small>Ao continuar, você inicia uma conversa com a equipe Originalli no WhatsApp.</small>',
    '</form>'
  ].join('\n');
}

async function writePage(slug, html) {
  const pageDir = resolve(dist, slug);
  await mkdir(pageDir, { recursive: true });
  await writeFile(resolve(pageDir, 'index.html'), html, 'utf8');
}

function innerDocument(title, description, body) {
  return [head(title, description, 'inner.css'), header(), "<main id='conteudo'>", body, '</main>', footer()].join('\n');
}

const aboutBody = [
  innerHero('Quem somos', 'Uma história construída sobre confiança.', 'Proteger patrimônios, empresas e famílias exige conhecimento, responsabilidade, experiência e compromisso com cada cliente.', 'Falar com a Originalli', '../contato/'),
  "<section class='inner-section'><div class='container story-layout'><div class='reveal'><p class='eyebrow dark'><span></span>Nossa história</p><h2>Conhecimento transformado em segurança.</h2></div><div class='story-copy reveal'><p class='lead'>A trajetória da Originalli está diretamente ligada à experiência e à visão empreendedora de seu fundador, Moisés de Souza.</p><p>Com mais de 45 anos de atuação no mercado segurador, construiu sua carreira sobre ética, transparência e compromisso. Essa experiência formou uma empresa preparada para atender desde necessidades individuais até estruturas empresariais complexas.</p><p>Hoje, a Originalli combina tecnologia, relacionamento humano e conhecimento técnico para acompanhar o cliente desde o diagnóstico até a gestão das coberturas e dos sinistros.</p></div></div></section>",
  "<section class='inner-section soft' id='equipe'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Equipe Originalli</p><h2>Experiência técnica com atendimento próximo.</h2><p>Profissionais responsáveis pela estratégia, pelo relacionamento comercial e pela operação cotidiana da corretora.</p></div><div class='team-grid'><article class='team-card reveal'><div class='team-photo-frame'><img src='../assets/equipe-moises-souza-v2-hd.webp' alt='Moisés de Souza' width='960' height='1200' loading='lazy' decoding='async'></div><div class='team-card-copy'><span>Consultor e corretor de seguros</span><h3>Moisés de Souza</h3></div></article><article class='team-card reveal'><div class='team-photo-frame'><img src='../assets/equipe-arthur-aguiar-v2-hd.webp' alt='Arthur Aguiar' width='960' height='1200' loading='lazy' decoding='async'></div><div class='team-card-copy'><span>Bacharel em direito e gerente comercial</span><h3>Arthur Aguiar</h3></div></article><article class='team-card reveal'><div class='team-photo-frame'><img src='../assets/equipe-amanda-souza-v2-hd.webp' alt='Amanda Z Souza' width='960' height='1200' loading='lazy' decoding='async'></div><div class='team-card-copy'><span>Gerente operacional</span><h3>Amanda Z Souza</h3></div></article></div></div></section>",
  "<section class='inner-section'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Direção</p><h2>O que orienta nosso trabalho.</h2></div><div class='feature-grid'><article class='feature-card reveal'><span>Missão</span><h3>Proteger com inteligência</h3><p>Proteger patrimônios, empresas e famílias por meio de seguros, gestão de riscos e atendimento consultivo.</p></article><article class='feature-card reveal'><span>Visão</span><h3>Ser referência</h3><p>Construir relacionamentos duradouros e gerar segurança por meio de consultoria securitária e proteção patrimonial.</p></article><article class='feature-card reveal'><span>Estrutura</span><h3>Presença e tecnologia</h3><p>Sede própria em Londrina, atuação nacional, suporte técnico e ferramentas para uma gestão contínua.</p></article></div></div></section>",
  "<section class='inner-section soft'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Nossos valores</p><h2>Princípios presentes em cada relação.</h2></div><div class='value-grid'><article><span>01</span><h3>Ética</h3><p>Transparência e responsabilidade.</p></article><article><span>02</span><h3>Compromisso</h3><p>Busca pela solução adequada.</p></article><article><span>03</span><h3>Respeito</h3><p>Valorização de pessoas e histórias.</p></article><article><span>04</span><h3>Excelência</h3><p>Profissionalismo e evolução.</p></article><article><span>05</span><h3>Confiança</h3><p>Relações sólidas e duradouras.</p></article></div></div></section>",
  "<section class='inner-section' id='especialistas'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Assessoria jurídica parceira</p><h2>Orientação jurídica em áreas que dialogam com o patrimônio.</h2><p>Advogados parceiros com atuação em diferentes áreas do Direito, para orientar decisões pessoais, patrimoniais e empresariais.</p></div><div class='team-grid team-grid-two'><article class='team-card reveal'><div class='team-photo-frame'><img src='../assets/equipe-joao-pedro-v2-hd.webp' alt='Dr João Pedro Marini Moreira' width='960' height='1200' loading='lazy' decoding='async'></div><div class='team-card-copy'><span>Advogado</span><h3>Dr. João Pedro Marini Moreira</h3><ul class='legal-practice-areas' aria-label='Áreas de atuação de Dr. João Pedro Marini Moreira'><li>Direito Tributário</li><li>Direito Bancário</li><li>Direito Civil</li></ul><a class='legal-contact' href='https://wa.me/5543996118888' target='_blank' rel='noopener'>Fale comigo pelo WhatsApp<br><small>(43) 99611-8888</small></a><div class='team-links'><a class='lattes-link' href='http://lattes.cnpq.br/7827410173207317' target='_blank' rel='noopener' aria-label='Consultar currículo Lattes de Dr. João Pedro Marini Moreira no CNPq'>Currículo Lattes · CNPq ↗</a><a href='https://www.instagram.com/joaomarini92?stkn=NXU5d3NtNGo1aTc2' target='_blank' rel='noopener'>Instagram ↗</a><a href='https://www.facebook.com/share/1DgJqBJrqs/?mibextid=wwXIfr' target='_blank' rel='noopener'>Facebook ↗</a></div></div></article><article class='team-card reveal'><div class='team-photo-frame'><img src='../assets/equipe-carlos-candido-v2-hd.webp' alt='Dr Carlos Aparecido Cândido' width='960' height='1200' loading='lazy' decoding='async'></div><div class='team-card-copy'><span>Advogado</span><h3>Dr. Carlos Aparecido Cândido</h3><ul class='legal-practice-areas' aria-label='Áreas de atuação de Dr. Carlos Aparecido Cândido'><li>Direito Empresarial</li><li>Direito Trabalhista</li><li>Direito Previdenciário</li></ul><a class='legal-contact' href='https://wa.me/5518996181818' target='_blank' rel='noopener'>Fale comigo pelo WhatsApp<br><small>(18) 99618-1818</small></a><div class='team-links'><a href='https://cacandido.adv.br/' target='_blank' rel='noopener'>Atuação jurídica ↗</a><a href='https://www.instagram.com/carloscandidoadv?stkn=MWRweWJuMXNrc3JndA==' target='_blank' rel='noopener'>Instagram ↗</a></div></div></article></div><p class='team-disclaimer'>Os serviços jurídicos são prestados de forma independente pelos profissionais responsáveis, mediante contratação própria, análise de viabilidade e verificação de eventuais conflitos. A Originalli não presta serviços advocatícios.</p></div></section>",
  "<section class='wide-cta'><div class='container wide-cta-layout'><h2>Nosso compromisso não termina na emissão da apólice. Ele começa ali.</h2><a class='button' href='../contato/'>Conheça a Originalli</a></div></section>"
].join('\n');

const solutionsBody = [
  innerHero('Soluções', 'Proteção adequada para cada realidade.', 'Cada patrimônio possui riscos diferentes. Organizamos nossas soluções por necessidade, sem perder a visão integrada de pessoas, bens, operações e responsabilidades.', 'Solicitar consultoria', '../contato/'),
  "<section class='inner-section soft'><div class='container'><div class='solution-index'>",
  "<article class='solution-group reveal'><span>Pessoas e famílias</span><h2>Vida e patrimônio</h2><div class='solution-links'><a href='../seguro-vida-individual/'>Seguro de vida individual</a><a href='../seguro-residencial/'>Seguro residencial</a><a href='../contrate-online/'>Automóvel e mobilidade</a><a href='../pessoas/'>Planejamento e proteção familiar</a></div></article>",
  "<article class='solution-group reveal'><span>Empresas e colaboradores</span><h2>Proteção corporativa</h2><div class='solution-links'><a href='../seguro-patrimonial/'>Patrimonial empresarial</a><a href='../seguro-vida-corporativo/'>Vida corporativo</a><a href='../seguro-saude-corporativo/'>Saúde corporativo</a><a href='../empresas/'>Consultoria e gestão de riscos</a></div></article>",
  "<article class='solution-group reveal'><span>Operações</span><h2>Mobilidade e equipamentos</h2><div class='solution-links'><a href='../seguro-transporte/'>Transportes</a><a href='../seguro-frotas/'>Frotas</a><a href='../equipamentos-agricolas/'>Equipamentos agrícolas</a><a href='../maquinas-linha-amarela/'>Máquinas linha amarela</a></div></article>",
  "<article class='solution-group reveal'><span>Responsabilidades e imóveis</span><h2>Riscos especializados</h2><div class='solution-links'><a href='../responsabilidade-civil/'>Responsabilidade civil geral</a><a href='../responsabilidade-civil/'>Responsabilidade civil profissional</a><a href='../seguro-condominio/'>Condomínios</a><a href='../empresas/'>Riscos de engenharia e continuidade</a></div></article>",
  "</div></div></section>",
  "<section class='inner-section'><div class='container story-layout'><div class='reveal'><p class='eyebrow dark'><span></span>Consultoria</p><h2>Mais do que contratar seguros.</h2></div><div class='story-copy reveal'><p class='lead'>Ajudamos o cliente a compreender seus riscos, definir prioridades e estruturar uma proteção coerente.</p><ul class='plain-list'><li>Diagnóstico e avaliação das necessidades</li><li>Estruturação e comparação de coberturas</li><li>Gestão da carteira e planejamento de renovações</li><li>Apoio e acompanhamento de sinistros</li></ul></div></div></section>",
  "<section class='wide-cta'><div class='container wide-cta-layout'><h2>Não encontrou o seguro que procura?</h2><a class='button' href='../contato/'>Falar com especialista</a></div></section>"
].join('\n');

const companiesBody = [
  innerHero('Gestão Originalli', 'Uma gestão. Todos os seguros da empresa.', 'Da pequena empresa às operações distribuídas: patrimônio, contratos, pessoas e continuidade tratados em uma visão integrada.', 'Solicitar análise empresarial', '../contato/?interesse=Consultoria%20securit%C3%A1ria%20e%20gest%C3%A3o%20de%20riscos'),
  "<div class='container editorial-photo'><img src='../assets/warehouse-workers.jpg' alt='Profissionais conversando em uma operação logística — imagem ilustrativa' width='1800' height='1198' loading='lazy'></div>",
  "<section class='inner-section soft'><div class='container'><div class='inner-section-head'><p class='eyebrow dark'>Gestão contínua</p><h2>Sua empresa vai além de uma apólice.</h2><p>Auditoria de contratos, organização patrimonial, análise de riscos, estruturação de coberturas e negociação com seguradoras. Acompanhamos vigências, endossos, renovações e sinistros, com informação para gestores e diretoria.</p></div><div class='portfolio-tags'>" + insuranceLibrary.slice(0,12).map(([id,title]) => "<a href='../biblioteca-seguros/#" + id + "'>" + esc(title) + " →</a>").join('') + "</div></div></section>",
  "<section class='inner-section' id='consultoria'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Empresas</p><h2>Proteção para quem gera resultados.</h2><p>Nosso trabalho começa antes da apólice: analisamos a operação, identificamos exposições e estruturamos soluções compatíveis com a realidade de cada negócio.</p></div><div class='feature-grid'>",
  "<article class='feature-card reveal'><span>Patrimônio</span><h3>Empresarial e industrial</h3><p>Edificações, estoques, máquinas, equipamentos, processos produtivos e lucros cessantes.</p><a href='../seguro-patrimonial/'>Conhecer solução</a></article>",
  "<article class='feature-card reveal'><span>Operação</span><h3>Transportes e frotas</h3><p>Cargas, embarcadores, transportadores, operações logísticas e veículos corporativos.</p><a href='../seguro-transporte/'>Conhecer solução</a></article>",
  "<article class='feature-card reveal'><span>Responsabilidades</span><h3>RC, D&amp;O e E&amp;O</h3><p>Proteção para empresas, gestores, profissionais, empregadores e riscos ambientais.</p><a href='../responsabilidade-civil/'>Conhecer solução</a></article>",
  "<article class='feature-card reveal'><span>Pessoas</span><h3>Benefícios corporativos</h3><p>Vida em grupo, acidentes pessoais, saúde empresarial e soluções para equipes.</p><a href='../seguro-vida-corporativo/'>Conhecer solução</a></article>",
  "<article class='feature-card reveal'><span>Ativos móveis</span><h3>Máquinas e equipamentos</h3><p>Proteção para equipamentos agrícolas, linha amarela e bens de uso operacional.</p><a href='../equipamentos-agricolas/'>Conhecer solução</a></article>",
  "<article class='feature-card reveal'><span>Continuidade</span><h3>Gestão da carteira</h3><p>Revisão de contratos, limites, franquias, endossos, pendências e renovações.</p><a href='#gestao'>Ver método</a></article>",
  "</div></div></section>",
  "<section class='inner-section dark' id='gestao'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow'><span></span>Gestão de riscos</p><h2>Capacidade para operações distribuídas.</h2><p>A experiência desenvolvida em programas com centenas de riscos se converte em uma gestão técnica, rastreável e atualizada.</p></div><div class='feature-grid'><article class='feature-card reveal'><span>01</span><h3>Cadastro por risco</h3><p>Locais, veículos, ativos, valores, proteções, fotos e documentos.</p></article><article class='feature-card reveal'><span>02</span><h3>Visão gerencial</h3><p>Status por unidade, pendências, responsáveis e próximos passos.</p></article><article class='feature-card reveal'><span>03</span><h3>Sinistros</h3><p>Acompanhamento do aviso à conclusão, com histórico e documentação.</p></article></div></div></section>",
  "<section class='inner-section soft'><div class='container story-layout'><div class='reveal'><p class='eyebrow dark'><span></span>Segmentos</p><h2>Conhecimento adaptado a cada operação.</h2></div><div class='story-copy reveal'><ul class='plain-list'><li>Indústrias e varejo</li><li>Transportadoras, distribuição e logística</li><li>Agronegócio</li><li>Prestadores de serviços e tecnologia</li><li>Construção civil</li></ul></div></div></section>",
  "<section class='wide-cta'><div class='container wide-cta-layout'><h2>Proteger uma empresa é uma decisão estratégica.</h2><a class='button' href='../contato/?interesse=Consultoria%20securit%C3%A1ria%20e%20gest%C3%A3o%20de%20riscos'>Solicitar análise empresarial</a></div></section>"
].join('\n');

const peopleBody = [
  innerHero('Para você', 'Proteção para a vida que você constrói.', 'Seguros para pessoas e famílias em todo o Brasil, com atendimento próximo desde a cotação.', 'Solicitar cálculo do seguro', '../contrate-online/'),
  "<div class='container editorial-photo'><img src='../assets/familia-brasileira-hd.webp' alt='Família em uma casa brasileira iluminada pela luz natural — imagem ilustrativa' width='1800' height='1200' loading='lazy'></div>",
  "<section class='inner-section' id='solucoes-pessoas'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Pessoas e famílias</p><h2>Cuidar do presente. Planejar o futuro.</h2><p>Analisamos necessidades, objetivos, renda e patrimônio para recomendar soluções coerentes com cada momento da vida.</p></div><div class='feature-grid'>",
  "<article class='feature-card reveal'><span>Vida</span><h3>Proteção financeira</h3><p>Capital e coberturas pensados para quem depende de você e para seus projetos.</p><a href='../seguro-vida-individual/'>Seguro de vida individual</a></article>",
  "<article class='feature-card reveal'><span>Moradia</span><h3>Residencial</h3><p>Imóvel, conteúdo, responsabilidades e serviços de assistência para o dia a dia.</p><a href='../seguro-residencial/'>Seguro residencial</a></article>",
  "<article class='feature-card reveal'><span>Mobilidade</span><h3>Automóvel</h3><p>Proteção para o veículo, ocupantes e terceiros, com assistência e suporte.</p><a href='../contrate-online/'>Iniciar atendimento</a></article>",
  "<article class='feature-card reveal'><span>Renda</span><h3>Acidentes pessoais</h3><p>Coberturas para situações inesperadas que podem afetar rotina e capacidade financeira.</p></article>",
  "<article class='feature-card reveal'><span>Futuro</span><h3>Previdência privada</h3><p>Planejamento para objetivos de longo prazo e aposentadoria complementar.</p></article>",
  "<article class='feature-card reveal'><span>Patrimônio</span><h3>Visão integrada</h3><p>Organização da proteção familiar em conjunto com os demais ativos e responsabilidades.</p></article>",
  "</div></div></section>",
  "<section class='inner-section soft'><div class='container story-layout'><div class='reveal'><p class='eyebrow dark'><span></span>Nosso compromisso</p><h2>Orientação próxima em cada etapa.</h2></div><div class='story-copy reveal'><ul class='plain-list'><li>Atendimento humano e personalizado</li><li>Análise técnica das coberturas</li><li>Acompanhamento permanente</li><li>Apoio em assistências e sinistros</li><li>Soluções ajustadas a cada fase da vida</li></ul></div></div></section>",
  "<section class='wide-cta'><div class='container wide-cta-layout'><h2>Segurança para hoje. Tranquilidade para amanhã.</h2><a class='button' href='../contato/'>Falar com especialista</a></div></section>"
].join('\n');

const insurersBody = [
  innerHero('Seguradoras', 'Independência para comparar. Experiência para recomendar.', 'Cada companhia possui critérios, especializações e diferenciais próprios. A Originalli representa o interesse do cliente na análise das alternativas.', 'Solicitar orientação', '../contato/'),
  "<section class='inner-section insurer-partners'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Nossas seguradoras parceiras</p><h2>Marcas reconhecidas. Escolhas analisadas com independência.</h2><p>Uma rede diversificada amplia as possibilidades de comparação e nos permite buscar a solução mais adequada para cada pessoa, família ou empresa.</p></div><div class='insurer-group reveal'><div class='insurer-group-head'><span>01</span><h3>Seguros patrimoniais e responsabilidades</h3></div><div class='insurer-logo-grid'><figure class='insurer-logo-card'><img src='../assets/seguradoras/aig.png' alt='AIG' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/alfa-seguradora.png' alt='Alfa Seguradora' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/allianz.png' alt='Allianz' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/axa-seguros.png' alt='AXA Seguros' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/hdi-seguros.png' alt='HDI Seguros' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/zurich.png' alt='Zurich' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/itau-seguros.png' alt='Itaú Seguros' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/mapfre.png' alt='MAPFRE' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/sompo-seguros.png' alt='Sompo Seguros' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/sura.png' alt='SURA' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/tokio-marine.png' alt='Tokio Marine Seguradora' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/yelum.png' alt='Yelum Seguradora' width='512' height='512' loading='lazy' decoding='async'></figure></div></div><div class='insurer-group reveal'><div class='insurer-group-head'><span>02</span><h3>Vida, saúde e benefícios</h3></div><div class='insurer-logo-grid'><figure class='insurer-logo-card'><img src='../assets/seguradoras/bradesco-seguros.png' alt='Bradesco Seguros' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/icatu.png' alt='Icatu' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/metlife.png' alt='MetLife' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/prudential.png' alt='Prudential' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/sulamerica.png' alt='SulAmérica' width='512' height='512' loading='lazy' decoding='async'></figure><figure class='insurer-logo-card'><img src='../assets/seguradoras/unimed.png' alt='Unimed' width='512' height='512' loading='lazy' decoding='async'></figure></div></div><p class='insurer-note reveal'>A indicação considera o perfil do risco, as condições vigentes e os critérios de aceitação de cada seguradora.</p></div></section>",
  "<section class='inner-section soft'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Critérios de seleção</p><h2>Como avaliamos cada solução.</h2><p>A recomendação considera o perfil do risco e a consistência do conjunto, não apenas o preço.</p></div><div class='criteria-list'><article><span>01</span><h3>Perfil do cliente</h3><p>Necessidades específicas de cada pessoa, família ou empresa.</p></article><article><span>02</span><h3>Coberturas</h3><p>Amplitude, limites, exclusões e qualidade das garantias.</p></article><article><span>03</span><h3>Atendimento</h3><p>Estrutura de suporte, assistência e condução de sinistros.</p></article><article><span>04</span><h3>Solidez</h3><p>Capacidade da seguradora de cumprir os compromissos assumidos.</p></article><article><span>05</span><h3>Custo-benefício</h3><p>Equilíbrio entre investimento, proteção e retenção de risco.</p></article><article><span>06</span><h3>Especialização</h3><p>Experiência da companhia no segmento e aderência à operação.</p></article></div></div></section>",
  "<section class='inner-section'><div class='container story-layout'><div class='reveal'><p class='eyebrow dark'><span></span>O cliente em primeiro lugar</p><h2>O papel da corretora é analisar e orientar.</h2></div><div class='story-copy reveal'><p class='lead'>Uma rede ampla de parceiros aumenta a capacidade de negociação e permite comparar cenários com independência.</p><p>Mais do que apresentar opções, ajudamos o cliente a entender as diferenças entre coberturas, condições, franquias e critérios de aceitação para tomar uma decisão consciente.</p></div></div></section>",
  "<section class='wide-cta'><div class='container wide-cta-layout'><h2>Precisa comparar alternativas?</h2><a class='button' href='../contato/'>Falar com especialista</a></div></section>"
].join('\n');

const onlineBody = [
  innerHero('Cotações on-line', 'Calcule seu seguro com a Originalli.', 'Escolha o seguro e solicite sua cotação. Nesta etapa, os dados são encaminhados à equipe pelo WhatsApp: não há cálculo de preço instantâneo nem contratação automática.', 'Solicitar cálculo', '#lead'),
  "<section class='inner-section' id='produtos-online'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Contrate on-line</p><h2>Escolha por onde começar.</h2><p>A jornada digital agiliza o contato sem abrir mão da análise e do suporte da equipe Originalli.</p></div><div class='online-product-grid'><a class='online-product reveal' href='#lead' data-fill-interest='Seguro automóvel'><span>01</span><h3>Automóvel</h3><p>Veículo, ocupantes, terceiros e assistências.</p><em>Iniciar cotação ↗</em></a><a class='online-product reveal' href='#lead' data-fill-interest='Seguro moto'><span>02</span><h3>Moto</h3><p>Proteção para uso profissional ou lazer.</p><em>Iniciar cotação ↗</em></a><a class='online-product reveal' href='#lead' data-fill-interest='Seguro caminhão'><span>03</span><h3>Caminhão</h3><p>Caminhões, cavalos mecânicos e implementos.</p><em>Iniciar cotação ↗</em></a><a class='online-product reveal' href='../seguro-residencial/'><span>04</span><h3>Residencial</h3><p>Imóvel, conteúdo e assistências.</p><em>Conhecer solução ↗</em></a><a class='online-product reveal' href='../seguro-vida-individual/'><span>05</span><h3>Vida individual</h3><p>Proteção financeira para sua família.</p><em>Conhecer solução ↗</em></a></div></div></section>",
  "<section class='inner-section soft'><div class='container'><div class='inner-section-head reveal'><p class='eyebrow dark'><span></span>Como funciona</p><h2>Uma jornada simples, com gente de verdade.</h2></div><div class='method-steps light-steps'><article><span>01</span><h3>Escolha</h3><p>Selecione o seguro ou indique o risco.</p></article><article><span>02</span><h3>Informe</h3><p>Envie os dados essenciais para começar.</p></article><article><span>03</span><h3>Compare</h3><p>Analisamos as alternativas disponíveis.</p></article><article><span>04</span><h3>Contrate</h3><p>Você recebe orientação até a emissão.</p></article></div></div></section>",
  "<section class='inner-section' id='lead'><div class='container contact-page-grid'><div class='reveal'><p class='eyebrow dark'><span></span>Comece agora</p><h2>Qual proteção você procura?</h2><p>Modalidades empresariais e riscos especiais também podem ser iniciados aqui.</p><ul class='plain-list'><li>Atendimento humano</li><li>Mais de 45 anos de experiência</li><li>Comparação técnica de coberturas</li><li>Suporte em sinistros</li></ul></div><div class='reveal'>" + leadForm('Contrate on-line', '', true) + '</div></div></section>'
].join('\n');

const contactBody = [
  innerHero('Contato', 'Estamos prontos para atender você.', 'Solicite uma cotação, converse sobre um risco, comunique um sinistro ou peça orientação especializada.', '', ''),
  "<section class='inner-section soft'><div class='container contact-page-grid'><div><div class='channel-grid reveal'><a class='channel-card' href='tel:+554333759800'><span>Central de atendimento</span><strong>(43) 3375-9800</strong><small>Comercial e administrativo</small></a><a class='channel-card' href='https://wa.me/554333759800' target='_blank' rel='noopener'><span>WhatsApp</span><strong>(43) 3375-9800</strong><small>Fale com nossa equipe</small></a><a class='channel-card' href='tel:08004009800'><span>Assistência 24 horas</span><strong>0800 400 9800</strong><small>Suporte quando você precisa</small></a><a class='channel-card' href='mailto:originalli@originalli.com.br'><span>E-mail</span><strong>originalli@originalli.com.br</strong><small>Envie sua solicitação</small></a></div><div class='contact-list reveal'><a href='https://www.google.com/maps/search/?api=1&amp;query=Rua+Ibipor%C3%A3+595+Londrina+PR' target='_blank' rel='noopener'><span>Sede Originalli</span><strong>Rua Ibiporã, 595 · Jardim Santo Antônio · Londrina/PR · CEP 86060-510</strong></a></div></div><div class='reveal'>" + leadForm('Contato', '', true) + '</div></div></section>'
].join('\n');

await writePage('quem-somos', innerDocument('Quem somos | Originalli', 'Conheça a história, a missão e os valores da Originalli, consultoria especializada em seguros e gestão de riscos.', aboutBody));
await writePage('solucoes', innerDocument('Soluções em seguros | Originalli', 'Seguros para pessoas e empresas: vida, saúde, patrimônio, transportes, frotas, responsabilidades, equipamentos e condomínios.', solutionsBody));
await writePage('empresas', innerDocument('Seguros e gestão de riscos para empresas | Originalli', 'Consultoria securitária para empresas, indústrias, varejo, transportes, frotas, responsabilidades, benefícios e riscos complexos.', companiesBody));
await writePage('pessoas', innerDocument('Seguros para pessoas e famílias | Originalli', 'Proteção para vida, residência, automóvel, renda, patrimônio e planejamento de pessoas e famílias.', peopleBody));
await writePage('seguradoras', innerDocument('Seguradoras e critérios de seleção | Originalli', 'Entenda como a Originalli compara seguradoras, coberturas, atendimento, solidez e custo-benefício.', insurersBody));
await writePage('contrate-online', innerDocument('Contrate seu seguro on-line | Originalli', 'Inicie on-line sua cotação de seguro auto, moto, caminhão, residencial ou vida com atendimento humano.', onlineBody));
await writePage('contato', innerDocument('Contato | Originalli', 'Fale com a Originalli para solicitar cotação, consultoria, assistência ou orientação em sinistros.', contactBody));
await writePage('central-originalli', innerDocument('Central Originalli | Emergências, sinistros e FIPE', 'Canais de emergência, assistência, orientação em sinistros, consulta FIPE e acesso ao boletim de ocorrência.', centralBody));

const products = [
  {
    slug: 'seguro-vida-individual',
    title: 'Seguro de Vida Individual',
    seo: 'Seguro de vida individual com análise personalizada de renda, família, beneficiários e coberturas.',
    kicker: 'Proteção pessoal',
    headline: 'Proteja a renda que sustenta seus planos.',
    lead: 'Estruturamos a proteção de acordo com sua realidade, responsabilidades e objetivos — sem reduzir uma decisão importante a uma cobertura genérica.',
    interest: 'Seguro de vida individual',
    audienceIntro: 'Uma solução para quem quer preservar a estabilidade financeira da família e organizar responsabilidades ao longo da vida.',
    audience: ['Profissionais e famílias com dependentes financeiros', 'Empresários e sócios que precisam integrar vida e patrimônio', 'Pessoas em fase de formação, expansão ou sucessão patrimonial'],
    analysis: [
      ['Capital adequado', 'Renda, compromissos, dependentes e horizonte de proteção.'],
      ['Coberturas', 'Morte, invalidez, doenças graves e eventos coerentes com o perfil.'],
      ['Beneficiários', 'Indicação, atualização e alinhamento com objetivos familiares.'],
      ['Custo no tempo', 'Prazo, atualização dos capitais e sustentabilidade da contratação.']
    ]
  },
  {
    slug: 'seguro-vida-corporativo',
    title: 'Seguro de Vida Corporativo',
    seo: 'Seguro de vida corporativo e vida em grupo para empresas, equipes e convenções coletivas.',
    kicker: 'Benefícios corporativos',
    headline: 'Proteção para pessoas. Valor para a empresa.',
    lead: 'Desenhamos programas de vida em grupo alinhados ao quadro de colaboradores, às regras internas e às obrigações da empresa.',
    interest: 'Seguro de vida corporativo',
    audienceIntro: 'Para empresas que desejam proteger equipes, cumprir exigências e fortalecer sua proposta de benefícios.',
    audience: ['Empresas de todos os portes com colaboradores', 'Negócios sujeitos a convenções coletivas', 'Organizações que buscam benefício flexível e gestão contínua'],
    analysis: [
      ['Perfil da equipe', 'Quantidade, faixas etárias, funções, salários e distribuição geográfica.'],
      ['Regras e capitais', 'Critério uniforme, múltiplos salariais ou capitais diferenciados.'],
      ['Coberturas coletivas', 'Morte, invalidez, acidentes e assistências compatíveis com o grupo.'],
      ['Movimentação', 'Inclusões, exclusões, faturamento e atualização cadastral.']
    ]
  },
  {
    slug: 'seguro-saude-corporativo',
    title: 'Seguro Saúde Corporativo',
    seo: 'Seguro saúde corporativo com análise de rede, perfil do grupo, abrangência, coparticipação e implantação.',
    kicker: 'Saúde empresarial',
    headline: 'Um plano de saúde coerente com sua empresa.',
    lead: 'Comparamos desenho, rede, abrangência e modelo de utilização para equilibrar cuidado, experiência do colaborador e previsibilidade.',
    interest: 'Seguro saúde corporativo',
    audienceIntro: 'Para empresas que buscam implantar, revisar ou migrar o benefício de saúde com orientação especializada.',
    audience: ['Pequenas, médias e grandes empresas', 'Grupos com operação em uma ou mais cidades', 'Empresas em implantação, renovação ou migração de plano'],
    analysis: [
      ['Perfil do grupo', 'Vidas, dependentes, idades, localidades e regras de elegibilidade.'],
      ['Rede e abrangência', 'Hospitais, laboratórios, municípios e necessidades de deslocamento.'],
      ['Modelo financeiro', 'Coparticipação, acomodação, reembolso e previsibilidade.'],
      ['Implantação', 'Prazos, documentos, comunicação e continuidade de atendimento.']
    ]
  },
  {
    slug: 'seguro-transporte',
    title: 'Seguro de Transporte',
    seo: 'Seguro de transporte para embarcadores e transportadores, com análise de carga, rota, operação, averbação e responsabilidades.',
    kicker: 'Embarcador e transportador',
    headline: 'A carga muda. A rota muda. A proteção precisa acompanhar.',
    lead: 'Analisamos mercadorias, frequência, origem, destino, modais e responsabilidades para estruturar a cobertura da operação.',
    interest: 'Seguro de transporte — embarcador ou transportador',
    audienceIntro: 'Atuamos dos dois lados da cadeia, respeitando as obrigações e exposições próprias de quem embarca e de quem transporta.',
    audience: ['Embarcadores com circulação nacional ou internacional', 'Transportadoras e operadores logísticos', 'Empresas com cargas especiais, sazonais ou de alto valor'],
    analysis: [
      ['Papel na operação', 'Responsabilidades do embarcador, transportador e demais envolvidos.'],
      ['Carga e percurso', 'Mercadoria, valor, embalagem, modal, rota e frequência.'],
      ['Gerenciamento de risco', 'Rastreamento, escolta, regras operacionais e planos de prevenção.'],
      ['Averbação e sinistros', 'Fluxo de declaração, documentos e resposta a ocorrências.']
    ]
  },
  {
    slug: 'responsabilidade-civil',
    title: 'Seguro de Responsabilidade Civil',
    seo: 'Seguro de responsabilidade civil geral e profissional para empresas, gestores e prestadores de serviços.',
    kicker: 'Geral e profissional',
    headline: 'Proteção para decisões, atividades e responsabilidades.',
    lead: 'Mapeamos as situações em que uma atividade pode gerar danos a terceiros, reclamações, custos de defesa ou impacto financeiro.',
    interest: 'Responsabilidade civil geral ou profissional',
    audienceIntro: 'A estrutura muda conforme a atividade, o contrato, o faturamento, o território e o tipo de responsabilidade assumida.',
    audience: ['Empresas com circulação de pessoas, produtos ou serviços', 'Profissionais sujeitos a alegações de erro ou omissão', 'Gestores e organizações com contratos de alta responsabilidade'],
    analysis: [
      ['Atividade e exposição', 'Operação, faturamento, território e histórico de reclamações.'],
      ['Danos a terceiros', 'Riscos corporais, materiais, morais e consequências financeiras.'],
      ['Responsabilidade profissional', 'Falhas, erros, omissões e custos de defesa.'],
      ['Contratos e limites', 'Exigências contratuais, franquias, retroatividade e exclusões.']
    ]
  },
  {
    slug: 'seguro-patrimonial',
    title: 'Seguro Patrimonial Empresarial',
    seo: 'Seguro patrimonial para empresas, indústrias e varejo com análise de valores em risco, coberturas e continuidade.',
    kicker: 'Empresas, indústrias e varejo',
    headline: 'Patrimônio protegido com base na operação real.',
    lead: 'Avaliamos edificações, estoques, máquinas, conteúdo, processos e dependências para reduzir lacunas entre o risco e a apólice.',
    interest: 'Seguro patrimonial empresarial',
    audienceIntro: 'Para negócios que precisam proteger bens e também planejar a continuidade depois de um evento coberto.',
    audience: ['Indústrias e centros de distribuição', 'Comércio, varejo e redes com múltiplas unidades', 'Empresas com máquinas, estoques ou imóveis relevantes'],
    analysis: [
      ['Valores em risco', 'Edificações, conteúdo, estoques, máquinas e critérios de reposição.'],
      ['Proteções existentes', 'Combate a incêndio, segurança, manutenção e prevenção.'],
      ['Coberturas e limites', 'Incêndio, danos elétricos, eventos da natureza e riscos específicos.'],
      ['Continuidade', 'Lucros cessantes, dependências e tempo estimado de recuperação.']
    ]
  },
  {
    slug: 'seguro-frotas',
    title: 'Seguro de Frotas',
    seo: 'Seguro de frotas para veículos leves e pesados, com análise de uso, perfil, sinistros e gestão da carteira.',
    kicker: 'Veículos corporativos',
    headline: 'Uma frota protegida começa por uma carteira bem gerida.',
    lead: 'Organizamos veículos, usos, perfis e histórico para estruturar coberturas e acompanhar movimentações e sinistros.',
    interest: 'Seguro de frotas',
    audienceIntro: 'Para empresas cuja mobilidade faz parte da rotina, da prestação de serviços ou da operação logística.',
    audience: ['Frotas leves comerciais e executivas', 'Veículos pesados e operações de transporte', 'Empresas com filiais, condutores e usos distintos'],
    analysis: [
      ['Composição da frota', 'Veículos, valores, categorias, uso e distribuição.'],
      ['Condutores e operação', 'Perfis, rotas, pernoite, controles e política de uso.'],
      ['Coberturas', 'Casco, terceiros, vidros, assistência e necessidades especiais.'],
      ['Histórico e gestão', 'Sinistralidade, movimentações, renovações e acompanhamento.']
    ]
  },
  {
    slug: 'equipamentos-agricolas',
    title: 'Seguro de Equipamentos Agrícolas',
    seo: 'Seguro para tratores, colheitadeiras, pulverizadores e equipamentos agrícolas em operação ou deslocamento.',
    kicker: 'Agronegócio',
    headline: 'Proteção para máquinas que não podem parar.',
    lead: 'Estruturamos a cobertura considerando valor, tipo de equipamento, utilização, deslocamento, armazenamento e contexto da operação rural.',
    interest: 'Seguro de equipamentos agrícolas',
    audienceIntro: 'Para produtores, prestadores de serviço e empresas que dependem de máquinas agrícolas de alto valor.',
    audience: ['Produtores rurais e grupos agrícolas', 'Prestadores de serviço mecanizado', 'Empresas com tratores, colheitadeiras e implementos'],
    analysis: [
      ['Equipamento', 'Marca, modelo, ano, valor e acessórios incorporados.'],
      ['Uso e local', 'Atividade, propriedade, terceiros e áreas de operação.'],
      ['Riscos em movimento', 'Deslocamento, tombamento, colisão e acidentes na atividade.'],
      ['Proteção e manutenção', 'Armazenamento, rastreamento, manutenção e prevenção.']
    ]
  },
  {
    slug: 'maquinas-linha-amarela',
    title: 'Seguro de Máquinas Linha Amarela',
    seo: 'Seguro para escavadeiras, pás-carregadeiras, retroescavadeiras e máquinas linha amarela.',
    kicker: 'Construção e infraestrutura',
    headline: 'Equipamentos de alto valor exigem análise de operação.',
    lead: 'Protegemos máquinas móveis considerando ambiente, utilização, operadores, deslocamentos e dependência do equipamento.',
    interest: 'Seguro de máquinas linha amarela',
    audienceIntro: 'Para empresas de construção, infraestrutura, mineração, locação e serviços que utilizam máquinas pesadas.',
    audience: ['Construtoras e empresas de infraestrutura', 'Locadoras e prestadores de serviço', 'Operações com escavadeiras, pás e retroescavadeiras'],
    analysis: [
      ['Máquina e valor', 'Modelo, ano, valor de reposição, acessórios e implementos.'],
      ['Ambiente de trabalho', 'Canteiro, terreno, atividade, exposição e regime de uso.'],
      ['Operação e transporte', 'Operadores, deslocamento próprio ou em prancha e terceiros.'],
      ['Paralisação', 'Dependência produtiva, manutenção e impacto da indisponibilidade.']
    ]
  },
  {
    slug: 'seguro-residencial',
    title: 'Seguro Residencial',
    seo: 'Seguro residencial para casa ou apartamento, com coberturas para imóvel, conteúdo, responsabilidade e assistências.',
    kicker: 'Casa e apartamento',
    headline: 'Proteção para o patrimônio onde sua vida acontece.',
    lead: 'Avaliamos o imóvel, o conteúdo e as necessidades da rotina para combinar coberturas e assistências de forma equilibrada.',
    interest: 'Seguro residencial',
    audienceIntro: 'Uma solução para proprietários, moradores e famílias que desejam proteger imóvel, bens e responsabilidades.',
    audience: ['Casas e apartamentos próprios ou alugados', 'Imóveis de moradia ou uso eventual', 'Famílias que valorizam assistências para o dia a dia'],
    analysis: [
      ['Imóvel e conteúdo', 'Tipo de construção, localização, uso e bens relevantes.'],
      ['Coberturas essenciais', 'Incêndio, danos elétricos, eventos da natureza e roubo.'],
      ['Responsabilidades', 'Danos a terceiros relacionados ao imóvel e à vida familiar.'],
      ['Assistências', 'Serviços emergenciais adequados à rotina da residência.']
    ]
  },
  {
    slug: 'seguro-condominio',
    title: 'Seguro Condomínio',
    seo: 'Seguro para condomínios residenciais ou comerciais, áreas comuns, responsabilidades e equipamentos.',
    kicker: 'Condomínios',
    headline: 'Áreas comuns protegidas. Gestão mais segura.',
    lead: 'Analisamos a estrutura do condomínio, equipamentos, responsabilidades e obrigações para adequar coberturas e limites.',
    interest: 'Seguro condomínio',
    audienceIntro: 'Para síndicos e administradoras que precisam proteger o patrimônio comum e conduzir decisões com segurança.',
    audience: ['Condomínios residenciais, comerciais ou mistos', 'Síndicos profissionais e moradores', 'Administradoras com uma ou várias carteiras'],
    analysis: [
      ['Estrutura e ocupação', 'Blocos, áreas comuns, unidades, uso e características construtivas.'],
      ['Equipamentos', 'Elevadores, portões, sistemas, painéis e instalações comuns.'],
      ['Responsabilidades', 'Síndico, condomínio, empregados e danos a terceiros.'],
      ['Coberturas e limites', 'Incêndio, danos elétricos, vendaval, vidros e riscos específicos.']
    ]
  }
];

function productPage(product) {
  const cards = product.analysis.map((item, index) => {
    return "<article class='analysis-card reveal'><span>0" + (index + 1) + "</span><h3>" + esc(item[0]) + "</h3><p>" + esc(item[1]) + '</p></article>';
  }).join('');
  const audience = product.audience.map((item) => '<li>' + esc(item) + '</li>').join('');
  const body = [
    head(product.title + ' | Originalli', product.seo, 'landing.css'),
    header(),
    "<main id='conteudo'>",
    "  <section class='landing-hero'><div class='container landing-hero-layout'>",
    "    <div class='landing-hero-copy reveal'><p class='breadcrumb'><a href='../'>Início</a><span>›</span><a href='../solucoes/'>Soluções</a><span>›</span>" + esc(product.title) + "</p><a class='library-back' href='../biblioteca-seguros/'>← Voltar à Biblioteca</a><p class='landing-kicker'>" + esc(product.kicker) + '</p><h1>' + esc(product.headline) + "</h1><p class='landing-hero-lead'>" + esc(product.lead) + "</p><div class='landing-mini-proof'><span>45+ anos de experiência</span><span>Análise consultiva</span><span>Acompanhamento em sinistros</span></div></div>",
    "    <div class='lead-panel reveal' id='lead'>" + leadForm(product.title, product.interest, false) + '</div>',
    '  </div></section>',
    "  <section class='trust-ribbon'><div class='container trust-ribbon-inner'><div><strong>Diagnóstico</strong><span>Antes de recomendar</span></div><div><strong>Comparação</strong><span>Coberturas e condições</span></div><div><strong>Acompanhamento</strong><span>Durante toda a relação</span></div></div></section>",
    "  <section class='landing-section soft'><div class='container'><div class='landing-section-head reveal'><p class='eyebrow dark'><span></span>O que analisamos</p><h2>A proteção começa pelas perguntas certas.</h2><p>Cada proposta é estruturada a partir das características do risco, dos objetivos e das condições relevantes para a contratação.</p></div><div class='analysis-grid'>" + cards + '</div></div></section>',
    "  <section class='landing-section'><div class='container audience-layout'><div class='audience-copy reveal'><p class='eyebrow dark'><span></span>Para quem é</p><h2>Uma solução alinhada ao seu contexto.</h2><p>" + esc(product.audienceIntro) + "</p><a class='text-link' href='#lead'>Quero conversar com um especialista <span>↗</span></a></div><div class='audience-card reveal'><span>Perfis atendidos</span><ul>" + audience + '</ul></div></div></section>',
    "  <section class='landing-section landing-process'><div class='container'><div class='method-heading reveal'><p class='eyebrow'><span></span>Como funciona</p><h2>Da análise ao acompanhamento.</h2></div><div class='method-steps'><article class='reveal'><span>01</span><h3>Entender</h3><p>Conhecemos a realidade e os objetivos.</p></article><article class='reveal'><span>02</span><h3>Analisar</h3><p>Mapeamos exposições e prioridades.</p></article><article class='reveal'><span>03</span><h3>Estruturar</h3><p>Comparamos condições e coberturas.</p></article><article class='reveal'><span>04</span><h3>Acompanhar</h3><p>Estamos presentes nas mudanças e sinistros.</p></article></div></div></section>",
    "  <section class='landing-final-cta'><div class='container landing-final-layout'><h2>Vamos analisar a proteção adequada para você?</h2><a class='button' href='#lead' data-track='final_lead'>Solicitar análise</a></div></section>",
    '</main>',
    footer()
  ].join('\n');
  return body;
}

for (const product of products) {
  await writePage(product.slug, productPage(product));
}

console.log('Generated ' + (products.length + 7) + ' pages.');

await writePage('biblioteca-seguros', innerDocument('Biblioteca de Seguros | Originalli', 'Conheça as modalidades de seguro e converse com a Originalli sobre sua proteção.', libraryBody()));
