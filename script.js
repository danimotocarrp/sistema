// URL APP SCRIPTS
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw_GzNkNoPvE0AkpScc_aL1ar0kBu1SsvSROLiIpx4YS2_gpiY2Zpckw9cpvLelBH8/exec";

// Variáveis Globais para OS
let listaClientesCache = [];
let veiculoSelecionadoOS = null;
let cacheVeiculosCliente = []; // Guarda os veículos do cliente selecionado
let clienteSelecionadoOS = null; // Guarda os cliente selecionado

let cacheConsultasClientes = [];
let cacheConsultasVeiculos = [];

let dadosClientesConsulta = [];
let dadosVeiculosConsulta = [];
let dadosOSConsulta = [];
let dadosServicosConsulta = [];
let dadosItensOSConsulta = [];

let osEditandoId = "";
let osModoLeitura = false;
let bloquearInicioAutomaticoOS = false;
const PDF_OS_ICON_URL = "https://blogger.googleusercontent.com/img/a/AVvXsEg7FoN7tsQ0E0UqQhQNFAarufN4VWh2QiuzV-V-5Fwbb5opBB5VfQNwzeQTuyTM9pYlc1VA8KR-CI9-B1vjMhkpUKNJq6t6tXncnWwh_fjfHLCPbwKkC9c1tnsC-KIVmXa9m_8aM3yitdLGF-Adrja5UFqixfoFVN_NYZy7I0sMhRmingR49IZV8V9Nx2A=s16000";

// Função para abrir o modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

// Função para fechar o modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

/**
 * EXEMPLO DE FUNÇÃO PARA CADASTRAR CLIENTE
 * Você pode chamar isso de um formulário futuramente
 */
async function cadastrarClienteExemplo() {
    const dados = {
        tabela: "CLIENTES",
        prefixo: "CLI",
        nome: "João da Silva",
        cpf: "123.456.789-00",
        telefone: "(11) 99999-9999",
        endereco: "Rua das Motos, 100"
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const resultado = await response.json();
        alert("Cliente cadastrado com ID: " + resultado.id);
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
    }
}

// Função para abrir o modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

// Função para fechar o modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Fechar o modal se o usuário clicar fora da caixa preta
window.onclick = function(event) {
    if (event.target.className === "modal") {
        event.target.style.display = "none";
    }
}

// Função para alterar o Label e o Placeholder dinamicamente
function configurarCampoDocumento() {
    const tipo = document.getElementById('cli_tipo_doc').value;
    const label = document.getElementById('lbl_documento');
    const input = document.getElementById('cli_documento');
    const erro = document.getElementById('msg_erro_doc');

    // Altera o texto do Label
    label.innerText = tipo;
    
    // Altera o exemplo (placeholder) e limpa o campo/erro
    input.value = "";
    erro.innerText = "";
    input.placeholder = (tipo === "CPF") ? "000.000.000-00" : "00.000.000/0000-00";
    
    input.focus();
}

// --- MÁSCARAS E VALIDAÇÕES ---

// Máscara Inteligente (CPF e CNPJ no mesmo campo)
document.getElementById('cli_documento').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    const tipo = document.getElementById('cli_tipo_doc').value;

    if (tipo === "CPF") {
        v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        v = v.substring(0, 14);
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    e.target.value = v;
});

// Máscara de Telefone
document.getElementById('cli_telefone').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    e.target.value = v.substring(0, 15);
});

// Máscara de Placa (XXX-0000)
document.getElementById('vei_placa').addEventListener('input', (e) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (v.length > 3) v = v.substring(0, 3) + "-" + v.substring(3, 7);
    e.target.value = v.substring(0, 8);
});

// --- COMUNICAÇÃO COM O BACKEND ---

// Verificar se já existe na Planilha
async function verificarExistencia(tabela, valor) {
    // 1. Validação de tamanho mínimo
    // Placas têm 8 caracteres (XXX-0000), Documentos têm 14 ou 18.
    const minChar = (tabela === 'VEICULOS') ? 8 : 14;
    if (!valor || valor.length < minChar) return;

    const msgId = (tabela === 'CLIENTES') ? 'msg_erro_doc' : 'msg_erro_placa';
    const msgElemento = document.getElementById(msgId);
    
    msgElemento.innerText = "⏳ Consultando...";
    msgElemento.style.color = "#2086c2";

    try {
        const response = await fetch(`${WEB_APP_URL}?tabela=${tabela}`);
        const dados = await response.json();
        
        let existe = false;

        if (tabela === 'CLIENTES') {
            // Verifica nas colunas de documento
            existe = dados.some(item => item.CPF === valor || item.CNPJ === valor);
        } else {
            // Verifica na coluna de placa
            existe = dados.some(item => item.PLACA === valor);
        }

        if (existe) {
            msgElemento.innerText = (tabela === 'CLIENTES') 
                ? "❌ Documento já cadastrado!" 
                : "❌ Esta placa já existe no sistema!";
            msgElemento.style.color = "#ff4d4d";
        } else {
            msgElemento.innerText = "✅ Disponível";
            msgElemento.style.color = "#b9e5f5";
        }
    } catch (e) {
        console.error("Erro ao verificar:", e);
        msgElemento.innerText = "";
    }
}

// Salvar Cliente / Atualizar Cliente
// --- FUNÇÃO SALVAR CLIENTE ---
async function salvarCliente() {
    const idEdit = document.getElementById('edit_cliente_id').value;
    const btn = document.getElementById('btn_salvar_cliente');
    const tipoDoc = document.getElementById('cli_tipo_doc').value;
    const valorDoc = document.getElementById('cli_documento').value;

    const dados = {
        tabela: "CLIENTES",
        nome: document.getElementById('cli_nome').value.trim(),
        cpf: tipoDoc === "CPF" ? valorDoc : "",
        cnpj: tipoDoc === "CNPJ" ? valorDoc : "",
        telefone: document.getElementById('cli_telefone').value,
        endereco: document.getElementById('cli_endereco').value
    };

    if (!dados.nome || (!dados.cpf && !dados.cnpj)) {
        return alert("Preencha o Nome e o Documento!");
    }

    if (idEdit) {
        dados.operacao = "EDITAR";
        dados.idCampo = "ID_CLIENTE";
        dados.idValor = idEdit;
    } else {
        dados.prefixo = "CLI";
    }

    btn.innerText = idEdit ? "Atualizando..." : "Gravando...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const result = await response.json();
        
        if (result.status === "sucesso") {
            if (idEdit) {
                alert("✅ Cliente atualizado com sucesso!");
                limparCampos('bloco_cliente');
                closeModal('modalCadastros');
                abrirConsultas();
            } else {
                alert("✅ Cliente cadastrado com sucesso! Agora cadastre o veículo abaixo.");
                document.getElementById('vei_id_cliente').value = result.id;
            }
        } else {
            alert("Erro no servidor: " + (result.message || result.mensagem || "Não foi possível salvar."));
        }
    } catch (erro) {
        console.error("Erro ao salvar cliente:", erro);
        alert("Erro ao conectar com o servidor.");
    } finally {
        const aindaEditando = document.getElementById('edit_cliente_id').value;
        btn.innerText = aindaEditando ? "Atualizar Cliente" : "Cadastrar Cliente";
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

// --- FUNÇÃO SALVAR VEÍCULO / ATUALIZAR VEÍCULO ---
async function salvarVeiculo() {
    const idEdit = document.getElementById('edit_veiculo_id').value;
    const btn = document.getElementById('btn_salvar_veiculo');
    
    const idCli = document.getElementById('vei_id_cliente').value;
    const placa = document.getElementById('vei_placa').value;

    if (!idCli) return alert("Informe o ID do cliente para vincular o veículo!");
    if (!placa) return alert("A placa é obrigatória!");

    const dados = {
        tabela: "VEICULOS",
        idCliente: idCli,
        tipo: document.getElementById('vei_tipo').value,
        marca: document.getElementById('vei_marca').value,
        modelo: document.getElementById('vei_modelo').value,
        placa: placa,
        cor: document.getElementById('vei_cor').value,
        ano: document.getElementById('vei_ano').value
    };

    if (idEdit) {
        dados.operacao = "EDITAR";
        dados.idCampo = "ID_VEICULO";
        dados.idValor = idEdit;
    } else {
        dados.prefixo = "VEI";
    }

    btn.innerText = idEdit ? "⏳ Atualizando..." : "⏳ Gravando...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const result = await response.json();

        if (result.status === "sucesso") {
            alert(idEdit ? "✅ Veículo atualizado com sucesso!" : "✅ Veículo cadastrado com sucesso!");

            limparCampos('bloco_veiculo');
            closeModal('modalCadastros');
            closeModal('modalSubVeiculos');

            if (idEdit) {
                abrirConsultas();
            } else {
                limparCampos('bloco_cliente');
            }
        } else {
            alert("Erro no servidor: " + (result.message || result.mensagem || "Não foi possível salvar."));
        }
    } catch (erro) {
        console.error("Erro ao salvar veículo:", erro);
        alert("Erro de conexão ao tentar salvar o veículo.");
    } finally {
        const aindaEditando = document.getElementById('edit_veiculo_id').value;
        btn.innerText = aindaEditando ? "Atualizar Veículo" : "Cadastrar Veículo";
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

function limparCampos(idContainer) {
    const container = document.getElementById(idContainer);
    
    if (!container) {
        console.warn("Aviso: Container " + idContainer + " não encontrado.");
        return;
    }

    // 1. Limpa todos os Inputs
    const inputs = container.querySelectorAll('input');
    inputs.forEach(i => i.value = "");

    // 2. Reseta todos os Selects (Combobox)
    const selects = container.querySelectorAll('select');
    selects.forEach(s => s.selectedIndex = 0);

    // 3. Limpa Mensagens de erro (<small>)
    const erros = container.querySelectorAll('.error-msg');
    erros.forEach(e => e.innerText = "");

    // 4. Se for o bloco de cliente, resetamos o Label para "CPF"
    if (idContainer === 'bloco_cliente') {
        const labelDoc = document.getElementById('lbl_documento');
        if (labelDoc) labelDoc.innerText = "CPF";
        
        // Também limpamos o campo de vínculo no formulário de veículo
        const vinculo = document.getElementById('vei_id_cliente');
        if (vinculo) vinculo.value = "";
    }
}

// Ao abrir o modal de OS, gera número e data
function iniciarOS() {
    osEditandoId = "";
    osModoLeitura = false;
    configurarModoLeituraOS(false);

    // 1. Número randômico de 4 dígitos
    const numOS = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('os_numero').innerText = numOS;

    // 2. Data no padrão PT-BR
    const data = new Date();
    document.getElementById('os_data_atual').innerText = data.toLocaleDateString('pt-BR');

    // 3. Limpa dados antigos do formulário
    clienteSelecionadoOS = null;
    veiculoSelecionadoOS = null;
    cacheVeiculosCliente = [];

    document.getElementById('os_busca_cliente').value = "";
    document.getElementById('os_sugestoes_cliente').innerHTML = "";
    document.getElementById('os_display_cliente').style.display = "none";
    document.getElementById('os_display_cliente').innerHTML = "";

    document.getElementById('os_select_veiculo').innerHTML = '<option value="">🔍 Selecione um cliente primeiro...</option>';
    document.getElementById('os_display_veiculos').style.display = "none";
    document.getElementById('os_display_veiculos').innerHTML = "";

    document.getElementById('os_descricao').value = "";
    document.getElementById('os_desconto').value = "0";
    document.getElementById('os_subtotal').innerText = "R$ 0,00";
    document.getElementById('os_total_geral').innerText = "R$ 0,00";

    // 4. Limpa e adiciona primeira linha de item
    document.getElementById('corpo_itens_os').innerHTML = "";
    adicionarLinhaItem();

    const btnGravar = document.querySelector('#modalOS .btn-save');
    if (btnGravar) btnGravar.innerHTML = '<i class="fa-solid fa-check"></i> Gravar OS';

    // 5. Busca clientes do back-end para o autocomplete
    carregarClientesParaOS();
}

// Sobrescrevendo a função openModal para inicializar se for OS
const originalOpenModal = openModal;
openModal = function(id) {
    originalOpenModal(id);
    if (id === 'modalOS' && !bloquearInicioAutomaticoOS) iniciarOS();
}

async function carregarClientesParaOS() {
    try {
        const response = await fetch(`${WEB_APP_URL}?tabela=CLIENTES`);
        listaClientesCache = await response.json();
    } catch(e) { console.error("Erro ao carregar clientes", e); }
}

function autocompleteCliente(valor) {
    const box = document.getElementById('os_sugestoes_cliente');
    box.innerHTML = "";
    if (valor.length < 2) return;

    const filtrados = listaClientesCache.filter(c => c.NOME.toLowerCase().includes(valor.toLowerCase()));
    
    filtrados.forEach(cliente => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerText = cliente.NOME;
        div.onclick = () => selecionarClienteOS(cliente);
        box.appendChild(div);
    });
}

function selecionarClienteOS(cliente) {
    clienteSelecionadoOS = cliente; // Salva o objeto completo do cliente selecionado
    
    document.getElementById('os_busca_cliente').value = cliente.NOME;
    document.getElementById('os_sugestoes_cliente').innerHTML = "";
    
    const display = document.getElementById('os_display_cliente');
    display.style.display = "grid";
    display.innerHTML = `
        <div><strong>Doc:</strong> ${cliente.CPF || cliente.CNPJ}</div>
        <div><strong>Tel:</strong> ${cliente.TELEFONE}</div>
        <div class="full-width"><strong>Endereço:</strong> ${cliente.ENDERECO}</div>
    `;
    
    buscarVeiculosDoCliente(cliente.ID_CLIENTE);
}

// Função chamada após selecionar o Cliente
async function buscarVeiculosDoCliente(idCliente) {
    const selectVei = document.getElementById('os_select_veiculo');
    const displayVei = document.getElementById('os_display_veiculos');
    
    selectVei.innerHTML = "<option>⏳ Carregando veículos...</option>";
    displayVei.style.display = "none";

    try {
        const response = await fetch(`${WEB_APP_URL}?tabela=VEICULOS`);
        const todosVeiculos = await response.json();
        
        // Filtra e armazena no cache local
        cacheVeiculosCliente = todosVeiculos.filter(v => v.ID_CLIENTE === idCliente);
        
        selectVei.innerHTML = '<option value="">🔍 Selecione o Veículo...</option>';
        
        if (cacheVeiculosCliente.length === 0) {
            selectVei.innerHTML = '<option value="">Nenhum veículo encontrado</option>';
            return;
        }

        // Popula o Combobox com "Placa | Modelo"
        cacheVeiculosCliente.forEach(v => {
            const option = document.createElement('option');
            option.value = v.ID_VEICULO;
            option.innerText = `${v.PLACA} | ${v.MODELO}`;
            selectVei.appendChild(option);
        });

    } catch (e) {
        console.error("Erro ao buscar veículos:", e);
        selectVei.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// Função chamada ao trocar a seleção no Combobox de Veículos
function mostrarDetalhesVeiculo(idVeiculo) {
    const display = document.getElementById('os_display_veiculos');
    
    if (!idVeiculo) {
        display.style.display = "none";
        veiculoSelecionadoOS = null;
        return;
    }

    // Busca os dados do veículo dentro do nosso cache
    const v = cacheVeiculosCliente.find(item => item.ID_VEICULO === idVeiculo);

    if (v) {
        veiculoSelecionadoOS = v; // Guarda para salvar na OS depois
        display.style.display = "grid";
        display.innerHTML = `
            <div><strong>Marca:</strong> ${v.MARCA}</div>
            <div><strong>Modelo:</strong> ${v.MODELO}</div>
            <div><strong>Placa:</strong> ${v.PLACA}</div>
            <div><strong>Cor:</strong> ${v.COR}</div>
            <div><strong>Ano:</strong> ${v.ANO}</div>
        `;
    }
}

// LÓGICA DE ITENS
function adicionarLinhaItem(item = {}) {
    const tbody = document.getElementById('corpo_itens_os');
    const row = document.createElement('tr');

    const desc = item.nome_servico || item.descricao || "";
    const qtd = item.quantidade || item.qtd || 1;
    const valor = item.valor_unit || item.valor || 0;
    const total = (parseFloat(qtd) || 0) * (parseFloat(valor) || 0);
    const disabled = osModoLeitura ? "disabled" : "";
    const botaoRemover = osModoLeitura ? "" : `<button onclick="this.parentElement.parentElement.remove(); calcularTotalGeral();">❌</button>`;

    row.innerHTML = `
        <td><input type="text" class="item-desc" value="${escapeHTML(desc)}" ${disabled}></td>
        <td><input type="number" class="item-qtd" value="${escapeHTML(qtd)}" oninput="calcularLinha(this)" ${disabled}></td>
        <td><input type="number" class="item-valor" value="${escapeHTML(valor)}" oninput="calcularLinha(this)" ${disabled}></td>
        <td class="item-total-linha">R$ ${total.toFixed(2)}</td>
        <td>${botaoRemover}</td>
    `;
    tbody.appendChild(row);
    calcularTotalGeral();
}

function calcularLinha(input) {
    const row = input.parentElement.parentElement;
    const qtd = row.querySelector('.item-qtd').value || 0;
    const valor = row.querySelector('.item-valor').value || 0;
    const total = qtd * valor;
    row.querySelector('.item-total-linha').innerText = `R$ ${total.toFixed(2)}`;
    calcularTotalGeral();
}

function calcularTotalGeral() {
    let subtotal = 0;
    document.querySelectorAll('.item-total-linha').forEach(celula => {
        subtotal += parseFloat(celula.innerText.replace('R$ ', '')) || 0;
    });
    
    const desconto = document.getElementById('os_desconto').value || 0;
    const totalGeral = subtotal - desconto;
    
    document.getElementById('os_subtotal').innerText = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('os_total_geral').innerText = `R$ ${totalGeral.toFixed(2)}`;
}

// GERAR PDF
function montarDetalhesOSDoFormulario() {
    const itens = [];
    document.querySelectorAll('#corpo_itens_os tr').forEach(linha => {
        const desc = linha.querySelector('.item-desc');
        const qtd = linha.querySelector('.item-qtd');
        const valor = linha.querySelector('.item-valor');
        if (desc && qtd && valor) {
            itens.push({
                nome_servico: desc.value,
                quantidade: qtd.value,
                valor_unit: valor.value
            });
        }
    });

    return {
        os: {
            ID_OS: osEditandoId,
            NUM_OS: document.getElementById('os_numero').innerText,
            DATA_OS: document.getElementById('os_data_atual').innerText,
            DESCRICAO: document.getElementById('os_descricao').value,
            DESCONTO: document.getElementById('os_desconto').value,
            SUBTOTAL: limparMoedaTexto(document.getElementById('os_subtotal').innerText),
            TOTAL_GERAL: limparMoedaTexto(document.getElementById('os_total_geral').innerText)
        },
        cliente: clienteSelecionadoOS || {},
        veiculo: veiculoSelecionadoOS || {},
        itens
    };
}

function preencherTemplatePDFOS(detalhes) {
    const os = detalhes.os || {};
    const cliente = detalhes.cliente || {};
    const veiculo = detalhes.veiculo || {};
    const itens = detalhes.itens || [];

    const osNum = valorCampo(os, ['NUM_OS', 'NUMERO_OS', 'N_OS']) || document.getElementById('os_numero').innerText || "0000";
    const dataOS = formatarDataBR(valorCampo(os, ['DATA_OS', 'DATA']));

    document.getElementById('print_os_num').innerText = osNum;
    document.getElementById('print_os_data').innerText = dataOS;
    document.getElementById('print_cli_nome').innerText = valorCampo(cliente, ['NOME', 'CLIENTE']) || "---";
    document.getElementById('print_cli_doc').innerText = valorCampo(cliente, ['CPF', 'CNPJ', 'DOCUMENTO']) || "---";
    document.getElementById('print_cli_tel').innerText = valorCampo(cliente, ['TELEFONE', 'TEL']) || "---";
    document.getElementById('print_cli_end').innerText = valorCampo(cliente, ['ENDERECO', 'ENDEREÇO']) || "---";

    document.getElementById('print_vei_modelo').innerText = valorCampo(veiculo, ['MODELO']) || "---";
    document.getElementById('print_vei_placa').innerText = valorCampo(veiculo, ['PLACA']) || "---";
    document.getElementById('print_vei_cor').innerText = valorCampo(veiculo, ['COR']) || "---";
    document.getElementById('print_os_desc').innerText = valorCampo(os, ['DESCRICAO', 'DESCRIÇÃO']) || "";

    const corpoItens = document.getElementById('print_itens_corpo');
    corpoItens.innerHTML = "";

    itens.forEach(item => {
        const desc = item.nome_servico || item.descricao || "Serviço s/ nome";
        const qtd = item.quantidade || item.qtd || 1;
        const uni = parseFloat(item.valor_unit || item.valor || 0) || 0;
        const total = (parseFloat(qtd) || 0) * uni;

        corpoItens.innerHTML += `
            <tr>
                <td style="border-bottom: 1px solid #eee; padding: 8px;">${escapeHTML(desc)}</td>
                <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${escapeHTML(qtd)}</td>
                <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:right;">R$ ${uni.toFixed(2)}</td>
                <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:right;">R$ ${total.toFixed(2)}</td>
            </tr>`;
    });

    const subtotal = parseFloat(valorCampo(os, ['SUBTOTAL']) || 0) || 0;
    const desconto = parseFloat(valorCampo(os, ['DESCONTO']) || 0) || 0;
    const totalGeral = parseFloat(valorCampo(os, ['TOTAL_GERAL']) || (subtotal - desconto)) || 0;

    document.getElementById('print_os_sub').innerText = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('print_os_desc_val').innerText = `R$ ${desconto.toFixed(2)}`;
    document.getElementById('print_os_total').innerText = `R$ ${totalGeral.toFixed(2)}`;
}

async function gerarPDFOS(detalhesOpcional = null) {
    const btn = document.querySelector('.btn-pdf');
    if (btn) btn.innerText = "⏳ A processar...";

    try {
        const detalhes = detalhesOpcional || montarDetalhesOSDoFormulario();
        preencherTemplatePDFOS(detalhes);

        const os = detalhes.os || {};
        const cliente = detalhes.cliente || {};
        const veiculo = detalhes.veiculo || {};
        const osNum = valorCampo(os, ['NUM_OS', 'NUMERO_OS', 'N_OS']) || "OS";
        const cliNome = valorCampo(cliente, ['NOME', 'CLIENTE']) || "Cliente";
        const placa = valorCampo(veiculo, ['PLACA']) || "SEM-PLACA";
        const dataOS = formatarDataBR(valorCampo(os, ['DATA_OS', 'DATA']));

        const nomeArquivo = `${osNum} - ${cliNome} - ${placa} - ${dataOS.replace(/\//g, "-")}.pdf`;
        const element = document.getElementById('os_print_template');
        element.style.display = 'block';

        const opt = {
            margin: 10,
            filename: nomeArquivo,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();
        element.style.display = 'none';

        alert("✅ PDF gerado: " + nomeArquivo);
    } catch (e) {
        console.error(e);
        alert("❌ Erro ao gerar o PDF.");
    } finally {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Salvar PDF';
    }
}

// GRAVAR OS
async function gravarOS(btn) {
    try {
        if (osModoLeitura) {
            alert("Esta Ordem de Serviço está aberta somente para leitura.");
            return;
        }

        if (!clienteSelecionadoOS || !veiculoSelecionadoOS) {
            alert("⚠️ Selecione um Cliente e um Veículo primeiro.");
            return;
        }

        const corpoTabela = document.getElementById('corpo_itens_os');
        if (!corpoTabela || corpoTabela.rows.length === 0) {
            alert("⚠️ A tabela de itens está vazia!");
            return;
        }

        if (btn) {
            btn.innerHTML = osEditandoId ? "⌛ ATUALIZANDO..." : "⌛ GRAVANDO...";
            btn.disabled = true;
        }

        const dadosOS = {
            tabela: "ORDEM_SERVICO",
            prefixo: "OS",
            id_cliente: clienteSelecionadoOS.ID_CLIENTE,
            id_veiculo: veiculoSelecionadoOS.ID_VEICULO,
            num_os: document.getElementById('os_numero').innerText,
            data_os: document.getElementById('os_data_atual').innerText,
            descricao: document.getElementById('os_descricao').value,
            desconto: document.getElementById('os_desconto').value || "0",
            subtotal: limparMoedaTexto(document.getElementById('os_subtotal').innerText),
            total_geral: limparMoedaTexto(document.getElementById('os_total_geral').innerText),
            itens: []
        };

        if (osEditandoId) {
            dadosOS.operacao = "EDITAR";
            dadosOS.idCampo = "ID_OS";
            dadosOS.idValor = osEditandoId;
        }

        document.querySelectorAll('#corpo_itens_os tr').forEach((linha) => {
            const desc = linha.querySelector('.item-desc');
            const qtd = linha.querySelector('.item-qtd');
            const val = linha.querySelector('.item-valor');

            if (desc && qtd && val && desc.value.trim()) {
                dadosOS.itens.push({
                    nome_servico: desc.value.trim(),
                    quantidade: qtd.value || "1",
                    valor_unit: val.value || "0"
                });
            }
        });

        if (dadosOS.itens.length === 0) {
            alert("⚠️ Informe pelo menos um serviço ou peça.");
            if (btn) btn.disabled = false;
            return;
        }

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dadosOS)
        });

        const result = await response.json();

        if (result.status !== "sucesso") {
            alert("Erro no servidor: " + (result.message || result.mensagem || "Não foi possível gravar a OS."));
            return;
        }

        alert(osEditandoId ? "✅ Ordem de Serviço atualizada!" : "✅ Ordem de Serviço gravada!");
        await carregarDadosConsultas();

        if (confirm("Deseja gerar o PDF?")) {
            await gerarPDFOS();
        }

        if (confirm("Deseja fechar a tela agora?")) {
            limparOS();
            closeModal('modalOS');
        }

    } catch (erro) {
        console.error("ERRO DETALHADO:", erro);
        alert("❌ Erro detectado: " + erro.message);
    } finally {
        if (btn) {
            btn.innerHTML = osEditandoId ? '<i class="fa-solid fa-check"></i> Atualizar OS' : '<i class="fa-solid fa-check"></i> Gravar OS';
            btn.disabled = false;
        }
    }
}

// Função limparOS para zerar o select também
function limparOS() {
    console.log("⏳ Iniciando limpeza completa...");

    // 1. Resetar variáveis globais
    clienteSelecionadoOS = null;
    veiculoSelecionadoOS = null;
    cacheVeiculosCliente = [];
    osEditandoId = "";
    osModoLeitura = false;
    configurarModoLeituraOS(false);

    // 2. Função interna para limpar sem dar erro
    const limparElemento = (id, tipo) => {
        const el = document.getElementById(id);
        if (el) {
            if (tipo === 'val') el.value = "";
            else if (tipo === 'text') el.innerText = "---";
            else if (tipo === 'html') el.innerHTML = "";
        } else {
            console.warn("⚠️ Aviso: Elemento não encontrado para limpeza: " + id);
        }
    };

    // --- LIMPAR DADOS DO CLIENTE ---
    // Verifique se esses IDs abaixo são os mesmos do seu HTML!
    limparElemento('cliente_nome_os', 'text');
    limparElemento('cliente_cpf_os', 'text');
    limparElemento('cliente_tel_os', 'text');
    limparElemento('os_busca_cliente', 'val'); // Campo de busca
    limparElemento('os_display_cliente', 'text');

    // --- LIMPAR DADOS DO VEÍCULO ---
    const selectOS = document.getElementById('os_select_veiculo');
    if (selectOS) selectOS.innerHTML = '<option value="">🔍 Selecione um cliente primeiro...</option>';
    limparElemento('os_display_veiculos', 'text');
    limparElemento('veiculo_modelo_os', 'text');
    limparElemento('veiculo_placa_os', 'text');
    limparElemento('veiculo_cor_os', 'text');

    // --- LIMPAR ITENS E FINANCEIRO ---
    limparElemento('corpo_itens_os', 'html'); // Tabela
    limparElemento('os_descricao', 'val');    // Textarea
    limparElemento('os_desconto', 'val');     // Input
    
    // Para o financeiro, voltamos ao zero
    const sub = document.getElementById('os_subtotal');
    if (sub) sub.innerText = "R$ 0,00";
    
    const tot = document.getElementById('os_total_geral');
    if (tot) tot.innerText = "R$ 0,00";

    const btnGravar = document.querySelector('#modalOS .btn-save');
    if (btnGravar) btnGravar.innerHTML = '<i class="fa-solid fa-check"></i> Gravar OS';

    console.log("Limpeza concluída.");
}

//PRELOADER
    // Remove o Preloader após o carregamento completo da página
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        
        // Pequeno delay para garantir que a renderização foi concluída
        setTimeout(() => {
            preloader.classList.add('loaded');
        }, 1000); 
    });


// FUNÇÕES AUXILIARES DA CONSULTA DE OS
function valorCampo(obj, nomes) {
    if (!obj) return "";
    for (const nome of nomes) {
        if (obj[nome] !== undefined && obj[nome] !== null && obj[nome] !== "") return obj[nome];
    }
    return "";
}

function escapeHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function limparMoedaTexto(valor) {
    if (!valor) return "0";
    let texto = String(valor).replace('R$', '').trim();

    // Aceita tanto formato brasileiro (1.234,56) quanto formato do JavaScript (1234.56)
    if (texto.includes(',') && texto.includes('.')) {
        texto = texto.replace(/\./g, '').replace(',', '.');
    } else if (texto.includes(',')) {
        texto = texto.replace(',', '.');
    }

    return texto;
}

function formatarDataBR(valor) {
    if (!valor) return "";
    if (typeof valor === "string" && valor.includes("/")) return valor;
    const data = new Date(valor);
    if (isNaN(data.getTime())) return valor;
    return data.toLocaleDateString('pt-BR');
}

function getIdOS(os) {
    return valorCampo(os, ['ID_OS', 'ID_ORDEM_SERVICO', 'ID_ORDEM', 'ID']);
}

function getNumOS(os) {
    return valorCampo(os, ['NUM_OS', 'NUMERO_OS', 'N_OS', 'OS']);
}

function getDataOS(os) {
    return formatarDataBR(valorCampo(os, ['DATA_OS', 'DATA']));
}

function buscarClientePorId(idCliente) {
    return dadosClientesConsulta.find(c => String(c.ID_CLIENTE) === String(idCliente));
}

function buscarVeiculoPorId(idVeiculo) {
    return dadosVeiculosConsulta.find(v => String(v.ID_VEICULO) === String(idVeiculo));
}

function montarDetalhesOS(idOS) {
    const os = dadosOSConsulta.find(item => String(getIdOS(item)) === String(idOS));
    if (!os) return null;

    const idCliente = valorCampo(os, ['ID_CLIENTE', 'id_cliente']);
    const idVeiculo = valorCampo(os, ['ID_VEICULO', 'id_veiculo']);
    const cliente = buscarClientePorId(idCliente) || { ID_CLIENTE: idCliente, NOME: "Cliente não encontrado" };
    const veiculo = buscarVeiculoPorId(idVeiculo) || { ID_VEICULO: idVeiculo, MODELO: "Veículo não encontrado" };

    const itensOS = dadosItensOSConsulta.filter(item => String(valorCampo(item, ['ID_OS', 'ID_ORDEM_SERVICO'])) === String(idOS));
    const itens = itensOS.map(item => {
        const idServico = valorCampo(item, ['ID_SERVICO']);
        const servico = dadosServicosConsulta.find(s => String(valorCampo(s, ['ID_SERVICO'])) === String(idServico)) || {};
        return {
            id_item: valorCampo(item, ['ID_ITEM', 'ID_ITENS_OS']),
            id_servico: idServico,
            nome_servico: valorCampo(servico, ['NOME_SERVICO', 'SERVICO', 'DESCRICAO', 'NOME']) || "Serviço s/ nome",
            quantidade: valorCampo(item, ['QUANTIDADE', 'QTD']) || 1,
            valor_unit: valorCampo(servico, ['VALOR_UNIT', 'VALOR_UNITARIO', 'VALOR']) || 0
        };
    });

    return { os, idOS, cliente, veiculo, itens };
}

function configurarModoLeituraOS(apenasLeitura) {
    osModoLeitura = apenasLeitura;
    const modal = document.getElementById('modalOS');
    if (!modal) return;

    modal.querySelectorAll('input, textarea, select').forEach(el => {
        el.disabled = apenasLeitura;
    });

    const btnAdicionar = modal.querySelector('.btn-add-item');
    const btnLimpar = modal.querySelector('.button-row .btn-clear');
    const btnGravar = modal.querySelector('.button-row .btn-save');

    if (btnAdicionar) btnAdicionar.style.display = apenasLeitura ? 'none' : 'inline-block';
    if (btnLimpar) btnLimpar.style.display = apenasLeitura ? 'none' : 'inline-block';
    if (btnGravar) btnGravar.style.display = apenasLeitura ? 'none' : 'inline-block';
}

function abrirModalOSConsulta() {
    bloquearInicioAutomaticoOS = true;
    openModal('modalOS');
    bloquearInicioAutomaticoOS = false;
}

function preencherFormularioOS(detalhes, apenasLeitura = false) {
    if (!detalhes) {
        alert("Ordem de Serviço não encontrada. Clique em CONSULTAS para recarregar os dados.");
        return;
    }

    const os = detalhes.os || {};
    clienteSelecionadoOS = detalhes.cliente || null;
    veiculoSelecionadoOS = detalhes.veiculo || null;
    cacheVeiculosCliente = veiculoSelecionadoOS ? [veiculoSelecionadoOS] : [];

    document.getElementById('os_numero').innerText = getNumOS(os) || "0000";
    document.getElementById('os_data_atual').innerText = getDataOS(os) || "00/00/0000";

    document.getElementById('os_busca_cliente').value = valorCampo(clienteSelecionadoOS, ['NOME']) || "";
    document.getElementById('os_sugestoes_cliente').innerHTML = "";

    const displayCli = document.getElementById('os_display_cliente');
    displayCli.style.display = "grid";
    displayCli.innerHTML = `
        <div><strong>Doc:</strong> ${escapeHTML(valorCampo(clienteSelecionadoOS, ['CPF', 'CNPJ', 'DOCUMENTO']) || '---')}</div>
        <div><strong>Tel:</strong> ${escapeHTML(valorCampo(clienteSelecionadoOS, ['TELEFONE', 'TEL']) || '---')}</div>
        <div class="full-width"><strong>Endereço:</strong> ${escapeHTML(valorCampo(clienteSelecionadoOS, ['ENDERECO', 'ENDEREÇO']) || '---')}</div>
    `;

    const selectVei = document.getElementById('os_select_veiculo');
    selectVei.innerHTML = "";
    if (veiculoSelecionadoOS) {
        const option = document.createElement('option');
        option.value = veiculoSelecionadoOS.ID_VEICULO || valorCampo(veiculoSelecionadoOS, ['ID_VEICULO']);
        option.innerText = `${valorCampo(veiculoSelecionadoOS, ['PLACA']) || 'SEM PLACA'} | ${valorCampo(veiculoSelecionadoOS, ['MODELO']) || ''}`;
        option.selected = true;
        selectVei.appendChild(option);
    } else {
        selectVei.innerHTML = '<option value="">Veículo não encontrado</option>';
    }

    const displayVei = document.getElementById('os_display_veiculos');
    displayVei.style.display = "grid";
    displayVei.innerHTML = `
        <div><strong>Marca:</strong> ${escapeHTML(valorCampo(veiculoSelecionadoOS, ['MARCA']) || '---')}</div>
        <div><strong>Modelo:</strong> ${escapeHTML(valorCampo(veiculoSelecionadoOS, ['MODELO']) || '---')}</div>
        <div><strong>Placa:</strong> ${escapeHTML(valorCampo(veiculoSelecionadoOS, ['PLACA']) || '---')}</div>
        <div><strong>Cor:</strong> ${escapeHTML(valorCampo(veiculoSelecionadoOS, ['COR']) || '---')}</div>
        <div><strong>Ano:</strong> ${escapeHTML(valorCampo(veiculoSelecionadoOS, ['ANO']) || '---')}</div>
    `;

    document.getElementById('os_descricao').value = valorCampo(os, ['DESCRICAO', 'DESCRIÇÃO']) || "";
    document.getElementById('os_desconto').value = valorCampo(os, ['DESCONTO']) || "0";

    const tbody = document.getElementById('corpo_itens_os');
    tbody.innerHTML = "";
    if (detalhes.itens && detalhes.itens.length > 0) {
        detalhes.itens.forEach(item => adicionarLinhaItem(item));
    } else {
        adicionarLinhaItem();
    }

    const subtotal = parseFloat(valorCampo(os, ['SUBTOTAL']) || 0) || 0;
    const total = parseFloat(valorCampo(os, ['TOTAL_GERAL']) || 0) || 0;
    document.getElementById('os_subtotal').innerText = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('os_total_geral').innerText = `R$ ${total.toFixed(2)}`;
    calcularTotalGeral();

    configurarModoLeituraOS(apenasLeitura);
}

function visualizarOS(idOS) {
    const detalhes = montarDetalhesOS(idOS);
    osEditandoId = "";
    abrirModalOSConsulta();
    preencherFormularioOS(detalhes, true);
    closeModal('modalConsultas');
}

function editarOS(idOS) {
    const detalhes = montarDetalhesOS(idOS);
    if (!detalhes) {
        alert("Ordem de Serviço não encontrada.");
        return;
    }

    osEditandoId = idOS;
    abrirModalOSConsulta();
    preencherFormularioOS(detalhes, false);

    const btnGravar = document.querySelector('#modalOS .btn-save');
    if (btnGravar) btnGravar.innerHTML = '<i class="fa-solid fa-check"></i> Atualizar OS';

    closeModal('modalConsultas');
}

async function excluirOS(idOS) {
    if (!confirm("Tem certeza que deseja excluir esta Ordem de Serviço? Os itens vinculados também serão removidos.")) return;

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                operacao: "EXCLUIR_OS",
                idValor: idOS
            })
        });

        const result = await response.json();

        if (result.status === "sucesso") {
            alert("Ordem de Serviço excluída com sucesso!");
            await carregarDadosConsultas();
        } else {
            alert("Erro ao excluir: " + (result.message || result.mensagem || "Registro não encontrado."));
        }
    } catch (erro) {
        console.error("Erro ao excluir OS:", erro);
        alert("Erro de conexão ao tentar excluir a Ordem de Serviço.");
    }
}

async function abrirPDFOS(idOS) {
    const detalhes = montarDetalhesOS(idOS);
    if (!detalhes) {
        alert("Ordem de Serviço não encontrada para gerar o PDF.");
        return;
    }
    await gerarPDFOS(detalhes);
}

function renderizarTabelaOS(lista) {
    const corpo = document.getElementById('corpo_consulta_os');
    if (!corpo) return;
    corpo.innerHTML = "";

    if (!lista || lista.length === 0) {
        corpo.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhuma Ordem de Serviço encontrada.</td></tr>";
        return;
    }

    lista.forEach(os => {
        const idOS = getIdOS(os);
        const idCliente = valorCampo(os, ['ID_CLIENTE', 'id_cliente']);
        const cliente = buscarClientePorId(idCliente);
        const nomeCliente = cliente ? cliente.NOME : "Cliente não encontrado";

        corpo.innerHTML += `
            <tr>
                <td>
                    <button class="btn-table" onclick="visualizarOS('${escapeHTML(idOS)}')" title="Visualizar OS">👁️‍🗨️</button>
                    <button class="btn-table" onclick="editarOS('${escapeHTML(idOS)}')" title="Editar OS">✏️</button>
                    <button class="btn-table" onclick="excluirOS('${escapeHTML(idOS)}')" title="Excluir OS">❌</button>
                    <button class="btn-table btn-pdf-mini" onclick="abrirPDFOS('${escapeHTML(idOS)}')" title="Gerar PDF da OS">
                        <img src="${PDF_OS_ICON_URL}" alt="PDF">
                    </button>
                </td>
                <td>${escapeHTML(getNumOS(os))}</td>
                <td>${escapeHTML(nomeCliente)}</td>
                <td>${escapeHTML(getDataOS(os))}</td>
            </tr>
        `;
    });
}

function atualizarAutocompleteOS() {
    const dl = document.getElementById('dl_os_autocomplete');
    if (!dl) return;
    dl.innerHTML = "";

    dadosOSConsulta.forEach(os => {
        const idCliente = valorCampo(os, ['ID_CLIENTE', 'id_cliente']);
        const cliente = buscarClientePorId(idCliente);
        if (getNumOS(os)) dl.innerHTML += `<option value="${escapeHTML(getNumOS(os))}">`;
        if (cliente && cliente.NOME) dl.innerHTML += `<option value="${escapeHTML(cliente.NOME)}">`;
        if (getDataOS(os)) dl.innerHTML += `<option value="${escapeHTML(getDataOS(os))}">`;
    });
}

function filtrarTabelaOSLocal() {
    const input = document.getElementById('busca_os_termo');
    const termo = input ? input.value.toLowerCase().trim() : "";

    const filtrados = dadosOSConsulta.filter(os => {
        const idCliente = valorCampo(os, ['ID_CLIENTE', 'id_cliente']);
        const cliente = buscarClientePorId(idCliente);
        const nomeCliente = cliente ? cliente.NOME.toLowerCase() : "";

        return String(getNumOS(os)).toLowerCase().includes(termo) ||
            nomeCliente.includes(termo) ||
            String(getDataOS(os)).toLowerCase().includes(termo) ||
            String(getIdOS(os)).toLowerCase().includes(termo);
    });

    renderizarTabelaOS(filtrados);
}

function limparBuscaOS() {
    const input = document.getElementById('busca_os_termo');
    if (input) input.value = "";
    renderizarTabelaOS(dadosOSConsulta);
}

// MODAL CONSULTAS
// 1. FUNÇÃO PARA ABRIR O MODAL E CARREGAR DADOS
async function abrirConsultas() {
    openModal('modalConsultas');
    await carregarDadosConsultas();
}

async function carregarDadosConsultas() {
    const corpoClientes = document.getElementById('corpo_consulta_clientes');
    const corpoOS = document.getElementById('corpo_consulta_os');

    if (corpoClientes) corpoClientes.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Carregando dados da nuvem...</td></tr>";
    if (corpoOS) corpoOS.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Carregando Ordens de Serviço...</td></tr>";

    try {
        const [respCli, respVei, respOS, respServ, respItens] = await Promise.all([
            fetch(WEB_APP_URL + "?tabela=CLIENTES"),
            fetch(WEB_APP_URL + "?tabela=VEICULOS"),
            fetch(WEB_APP_URL + "?tabela=ORDEM_SERVICO"),
            fetch(WEB_APP_URL + "?tabela=SERVICOS"),
            fetch(WEB_APP_URL + "?tabela=ITENS_OS")
        ]);

        dadosClientesConsulta = await respCli.json();
        dadosVeiculosConsulta = await respVei.json();
        dadosOSConsulta = await respOS.json();
        dadosServicosConsulta = await respServ.json();
        dadosItensOSConsulta = await respItens.json();

        listaClientesCache = dadosClientesConsulta;

        renderizarTabelaClientes(dadosClientesConsulta);
        atualizarAutocompleteClientes();
        renderizarTabelaOS(dadosOSConsulta);
        atualizarAutocompleteOS();
    } catch (e) {
        console.error("Erro ao carregar consultas:", e);
        if (corpoClientes) corpoClientes.innerHTML = "<tr><td colspan='7' style='color:red;'>Erro ao carregar dados. Verifique a conexão.</td></tr>";
        if (corpoOS) corpoOS.innerHTML = "<tr><td colspan='4' style='color:red;'>Erro ao carregar Ordens de Serviço.</td></tr>";
    }
}

// 2. RENDERIZAR TABELA DE CLIENTES
function renderizarTabelaClientes(lista) {
    const corpo = document.getElementById('corpo_consulta_clientes');
    corpo.innerHTML = "";

    lista.forEach(cli => {
        // Lógica DOC: Se tiver CPF mostra CPF, senão tenta CNPJ
        const documento = cli.CPF || cli.CNPJ || "---";

        corpo.innerHTML += `
            <tr>
                <td>
                    <button class="btn-table" onclick="editarCliente('${cli.ID_CLIENTE}')" title="Editar">✏️</button>
                    <button class="btn-table" onclick="excluirCliente('${cli.ID_CLIENTE}')" title="Excluir">❌</button>
                </td>
                <td>${cli.ID_CLIENTE}</td>
                <td>${cli.NOME}</td>
                <td>${documento}</td>
                <td>${cli.TELEFONE}</td>
                <td>${cli.ENDERECO}</td>
                <td>
                    <a href="#" class="link-veiculos" onclick="event.preventDefault(); abrirSubVeiculos('${cli.ID_CLIENTE}')">
                        <i class="fas fa-external-link-alt"></i> Ver Veículo(s)
                    </a>
                </td>
            </tr>
        `;
    });
}

// 3. AUTOCOMPLETE E FILTRO DINÂMICO
function atualizarAutocompleteClientes() {
    const dl = document.getElementById('dl_clientes_autocomplete');
    dl.innerHTML = "";
    // Popula com Nomes, CPFs e CNPJs para busca global
    dadosClientesConsulta.forEach(c => {
        if (c.NOME) dl.innerHTML += `<option value="${c.NOME}">`;
        if (c.CPF) dl.innerHTML += `<option value="${c.CPF}">`;
        if (c.CNPJ) dl.innerHTML += `<option value="${c.CNPJ}">`;
    });
}

function filtrarTabelaClientesLocal() {
    const termo = document.getElementById('busca_cliente_termo').value.toLowerCase();
    const filtrados = dadosClientesConsulta.filter(c => 
        (c.NOME && c.NOME.toLowerCase().includes(termo)) ||
        (c.CPF && c.CPF.includes(termo)) ||
        (c.CNPJ && c.CNPJ.includes(termo)) ||
        (c.ID_CLIENTE && c.ID_CLIENTE.toLowerCase().includes(termo))
    );
    renderizarTabelaClientes(filtrados);
}

function limparBuscaCliente() {
    document.getElementById('busca_cliente_termo').value = "";
    renderizarTabelaClientes(dadosClientesConsulta);
}

// 4. Submodal de Veículos
// 4. LÓGICA DO SUBMODAL DE VEÍCULOS
function abrirSubVeiculos(idCliente) {
    const corpo = document.getElementById('corpo_sub_veiculos');
    corpo.innerHTML = "";

    const veiculosFiltrados = dadosVeiculosConsulta.filter(v => String(v.ID_CLIENTE) === String(idCliente));

    if (veiculosFiltrados.length === 0) {
        corpo.innerHTML = "<tr><td colspan='8' style='text-align:center;'>Nenhum veículo vinculado.</td></tr>";
    } else {
        veiculosFiltrados.forEach(v => {
            corpo.innerHTML += `
                <tr>
                    <td>
                        <button class="btn-table" onclick="editarVeiculo('${v.ID_VEICULO}')" title="Editar veículo">✏️</button>
                        <button class="btn-table" onclick="excluirVeiculo('${v.ID_VEICULO}')" title="Excluir veículo">❌</button>
                    </td>
                    <td>${v.ID_VEICULO || ""}</td>
                    <td>${v.TIPO || ""}</td>
                    <td>${v.MARCA || ""}</td>
                    <td>${v.MODELO || ""}</td>
                    <td>${v.PLACA || ""}</td>
                    <td>${v.COR || ""}</td>
                    <td>${v.ANO || ""}</td>
                </tr>
            `;
        });
    }
    openModal('modalSubVeiculos');
}

// 5. Troca de Abas
function switchTab(evt, tabName) {
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(p => p.classList.remove('active'));
    
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');

    if (tabName === 'abaOS') {
        renderizarTabelaOS(dadosOSConsulta);
        atualizarAutocompleteOS();
    }
}

// 5. ORDENAÇÃO DE TABELAS
function sortDataTable(tableId, colIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.rows);
    const isAsc = table.dataset.sortDir !== 'asc';
    
    rows.sort((a, b) => {
        const valA = a.cells[colIndex].innerText.toLowerCase();
        const valB = b.cells[colIndex].innerText.toLowerCase();
        return isAsc ? valA.localeCompare(valB, undefined, {numeric: true}) : valB.localeCompare(valA, undefined, {numeric: true});
    });

    table.dataset.sortDir = isAsc ? 'asc' : 'desc';
    rows.forEach(row => tbody.appendChild(row));
}

// 1. FUNÇÃO PARA EXCLUIR O CLIENTE (E SEUS VEÍCULOS)
async function excluirCliente(idCliente) {
    // Pergunta para o usuário se ele tem certeza (segurança)
    const confirmacao = confirm("Tem certeza que deseja excluir este cliente? Isso removerá todos os veículos vinculados a ele permanentemente!");
    
    if (!confirmacao) return; // Se cancelar, não faz nada

    try {
        // Prepara o "pacote" de dados para enviar ao BackEnd
        const dados = {
            operacao: "EXCLUIR",
            tabela: "CLIENTES",
            idCampo: "ID_CLIENTE",
            idValor: idCliente
        };

        // Envia para o Google Apps Script
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.status === "sucesso") {
            // Se o cliente foi excluído, vamos apagar também os veículos dele na aba VEICULOS
            await excluirVeiculosDoCliente(idCliente);
            
            alert("Cliente e veículos removidos com sucesso!");
            
            // Atualiza a tabela na tela sem precisar dar F5
            abrirConsultas(); 
        } else {
            alert("Erro ao excluir: " + result.mensagem);
        }

    } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Erro de conexão ao tentar excluir.");
    }
}

// 2. FUNÇÃO AUXILIAR PARA LIMPAR VEÍCULOS VINCULADOS
async function excluirVeiculosDoCliente(idCliente) {
    const dadosVei = {
        operacao: "EXCLUIR",
        tabela: "VEICULOS",
        idCampo: "ID_CLIENTE",
        idValor: idCliente
    };

    await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(dadosVei)
    });
}

// EXCLUIR SOMENTE O VEÍCULO NO SUBMODAL
async function excluirVeiculo(idVeiculo) {
    if (!confirm("Deseja remover este veículo?")) return;

    try {
        const dados = {
            operacao: "EXCLUIR",
            tabela: "VEICULOS",
            idCampo: "ID_VEICULO",
            idValor: idVeiculo
        };

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.status === "sucesso") {
            alert("Veículo removido!");
            closeModal('modalSubVeiculos'); // Fecha o submodal
            abrirConsultas(); // Atualiza os dados de fundo
        }
    } catch (e) {
        alert("Erro ao excluir veículo.");
    }
}

// UPDATE DO REGISTRO
// Editar Cliente pela aba Consultas Gerais > CLIENTES
function editarCliente(idCliente) {
    const cliente = dadosClientesConsulta.find(c => String(c.ID_CLIENTE) === String(idCliente));

    if (!cliente) {
        alert("Cliente não encontrado na consulta. Clique novamente em CONSULTAS para recarregar os dados.");
        return;
    }

    document.getElementById('edit_cliente_id').value = cliente.ID_CLIENTE;
    document.getElementById('cli_nome').value = cliente.NOME || "";
    document.getElementById('cli_tipo_doc').value = cliente.CPF ? "CPF" : "CNPJ";
    document.getElementById('lbl_documento').innerText = cliente.CPF ? "CPF" : "CNPJ";
    document.getElementById('cli_documento').value = cliente.CPF || cliente.CNPJ || "";
    document.getElementById('cli_telefone').value = cliente.TELEFONE || "";
    document.getElementById('cli_endereco').value = cliente.ENDERECO || "";

    document.getElementById('btn_salvar_cliente').innerText = "Atualizar Cliente";

    closeModal('modalConsultas');
    closeModal('modalSubVeiculos');
    openModal('modalCadastros');

    document.getElementById('cli_nome').focus();
}

// Editar Veículo pelo link "Ver Veículo(s)"
function editarVeiculo(idVeiculo) {
    const v = dadosVeiculosConsulta.find(item => String(item.ID_VEICULO) === String(idVeiculo));

    if (!v) {
        alert("Veículo não encontrado na consulta. Clique novamente em CONSULTAS para recarregar os dados.");
        return;
    }

    document.getElementById('edit_veiculo_id').value = v.ID_VEICULO;
    document.getElementById('vei_id_cliente').value = v.ID_CLIENTE || "";
    document.getElementById('vei_tipo').value = v.TIPO || "Carro";
    document.getElementById('vei_marca').value = v.MARCA || "";
    document.getElementById('vei_modelo').value = v.MODELO || "";
    document.getElementById('vei_placa').value = v.PLACA || "";
    document.getElementById('vei_cor').value = v.COR || "";
    document.getElementById('vei_ano').value = v.ANO || "";

    document.getElementById('btn_salvar_veiculo').innerText = "Atualizar Veículo";

    closeModal('modalSubVeiculos');
    closeModal('modalConsultas');
    openModal('modalCadastros');

    document.getElementById('vei_marca').focus();
}

// Limpa os blocos de cadastro e também cancela o modo de edição
function limparCampos(idBloco) {
    const bloco = document.getElementById(idBloco);
    if (!bloco) return;

    const campos = bloco.querySelectorAll('input, textarea');
    campos.forEach(campo => campo.value = "");

    const selects = bloco.querySelectorAll('select');
    selects.forEach(select => select.selectedIndex = 0);

    const erros = bloco.querySelectorAll('.error-msg');
    erros.forEach(erro => erro.innerText = "");

    if (idBloco === 'bloco_cliente') {
        document.getElementById('edit_cliente_id').value = "";
        document.getElementById('btn_salvar_cliente').innerText = "Cadastrar Cliente";
        document.getElementById('lbl_documento').innerText = "CPF";
    }

    if (idBloco === 'bloco_veiculo') {
        document.getElementById('edit_veiculo_id').value = "";
        document.getElementById('btn_salvar_veiculo').innerText = "Cadastrar Veículo";
    }
}
