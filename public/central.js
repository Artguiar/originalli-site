(() => {
  const type = document.querySelector('#fipe-type');
  const brand = document.querySelector('#fipe-brand');
  const model = document.querySelector('#fipe-model');
  const year = document.querySelector('#fipe-year');
  const status = document.querySelector('#fipe-status');
  const result = document.querySelector('#fipe-result');
  const form = document.querySelector('#fipe-form');
  let requestNumber = 0;
  let controller;
  function reset(select, label) {
    select.replaceChildren(new Option(label, ''));
    select.disabled = true;
  }
  function clearResult() { result.hidden = true; result.replaceChildren(); }
  async function request(path, onSuccess) {
    const number = ++requestNumber;
    controller?.abort();
    controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    status.textContent = 'Consultando…';
    try {
      const response = await fetch('/api/fipe/' + path, {signal: controller.signal});
      if (!response.ok) throw new Error('Consulta indisponível');
      const data = await response.json();
      if (number !== requestNumber) return;
      onSuccess(data);
      status.textContent = '';
    } catch {
      if (number === requestNumber) status.textContent = 'Consulta indisponível no momento. Tente selecionar novamente ou use o link da FIPE ao lado.';
    } finally { clearTimeout(timer); }
  }
  function fill(select, rows, label) {
    if (!Array.isArray(rows) || !rows.length) throw new Error('Sem resultados');
    reset(select, label);
    for (const row of rows) select.add(new Option(String(row.nome), String(row.codigo)));
    select.disabled = false;
  }
  function invalidate() { requestNumber++; controller?.abort(); status.textContent = ''; clearResult(); }
  type.addEventListener('change', () => {
    invalidate(); reset(brand, 'Escolha o tipo'); reset(model, 'Escolha a marca'); reset(year, 'Escolha o modelo');
    if (type.value) request(type.value + '/marcas', data => fill(brand, data, 'Selecione a marca'));
  });
  brand.addEventListener('change', () => {
    invalidate(); reset(model, 'Escolha a marca'); reset(year, 'Escolha o modelo');
    if (brand.value) request(`${type.value}/marcas/${encodeURIComponent(brand.value)}/modelos`, data => fill(model, data.modelos, 'Selecione o modelo'));
  });
  model.addEventListener('change', () => {
    invalidate(); reset(year, 'Escolha o modelo');
    if (model.value) request(`${type.value}/marcas/${encodeURIComponent(brand.value)}/modelos/${encodeURIComponent(model.value)}/anos`, data => fill(year, data, 'Selecione o ano-modelo'));
  });
  year.addEventListener('change', invalidate);
  form.addEventListener('submit', event => {
    event.preventDefault(); clearResult();
    if (![type,brand,model,year].every(select => select.value && !select.disabled)) { status.textContent = 'Selecione tipo, marca, modelo e ano-modelo.'; return; }
    request(`${type.value}/marcas/${encodeURIComponent(brand.value)}/modelos/${encodeURIComponent(model.value)}/anos/${encodeURIComponent(year.value)}`, data => {
      if (!data.Valor || !data.Modelo || !data.MesReferencia) throw new Error('Resposta incompleta');
      for (const [tag,text] of [['h3',data.Marca + ' · ' + data.Modelo],['strong',data.Valor],['p',`Ano-modelo: ${data.AnoModelo} · ${data.Combustivel}`],['p',`Código FIPE: ${data.CodigoFipe} · Referência: ${data.MesReferencia}`]]) {
        const node = document.createElement(tag); node.textContent = text; result.append(node);
      }
      const link = document.createElement('a'); link.className = 'text-link'; link.href = '../contrate-online/'; link.textContent = 'Solicitar cotação do seguro →'; result.append(link); result.hidden = false;
    });
  });
  document.querySelector('#bo-uf').addEventListener('change', event => {
    const uf = event.target.value;
    const direct = {PR: 'https://www.policiacivil.pr.gov.br/BO', SP: 'https://delegaciadigital.policia-civil.sp.gov.br/pagina-inicial'};
    const link = document.querySelector('#bo-link');
    link.href = direct[uf] || 'https://www.gov.br/pt-br/servicos/registrar-ocorrencia-policial-online';
    link.textContent = direct[uf] ? `Abrir Polícia Civil — ${uf} ↗` : 'Consultar portal federal ↗';
    document.querySelector('#bo-note').textContent = direct[uf] ? 'Você será encaminhado ao portal oficial do estado selecionado. Confira os tipos de ocorrência aceitos.' : uf ? `${uf}: consulte a disponibilidade na Delegacia Virtual federal e selecione o estado novamente no portal. Se não houver atendimento para sua UF, procure a Polícia Civil local.` : 'Selecione a UF para consultar o encaminhamento disponível.';
  });
})();
