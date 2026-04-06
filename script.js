// COLE AQUI O URL GERADO NO SEU GOOGLE APPS SCRIPT
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_GzNkNoPvE0AkpScc_aL1ar0kBu1SsvSROLiIpx4YS2_gpiY2Zpckw9cpvLelBH8/exec'; 

// --- Controle de Modais ---
function openModal(id) {
    document.getElementById(id).style.display = "block";
    if (id === 'modal-os') initOS();
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

// --- Máscaras ---
function maskCPF(i) {
    let v = i.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    i.value = v;
}

function maskPhone(i) {
    let v = i.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    i.value = v;
}

function maskPlate(i) {
    let v = i.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3);
    i.value = v;
}

// --- Cadastros (Cliente e Veículo) ---
document.getElementById('form-cliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Salvando...";
    
    const data = {
        action: "saveClient",
        nome: document.getElementById('cli-nome').value,
        cpf: document.getElementById('cli-cpf').value,
        telefone: document.getElementById('cli-telefone').value,
        endereco: document.getElementById('cli-endereco').value
    };

    const response = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    const result = await response.json();

    if(result.status === "error") {
        alert(result.message);
    } else {
        alert("Cliente cadastrado! ID: " + result.id);
        document.getElementById('vei-id-cliente').value = result.id; // Vincula ID
        document.getElementById('form-cliente').reset();
    }
    btn.innerText = "Salvar Cliente";
});

document.getElementById('form-veiculo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Salvando...";

    const data = {
        action: "saveVehicle",
        idCliente: document.getElementById('vei-id-cliente').value,
        tipo: document.querySelector('input[name="vei-tipo"]:checked').value,
        marca: document.getElementById('vei-marca').value,
        modelo: document.getElementById('vei-modelo').value,
        placa: document.getElementById('vei-placa').value,
        cor: document.getElementById('vei-cor').value,
        ano: document.getElementById('vei-ano').value
    };

    const response = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    const result = await response.json();
    
    // VERIFICAÇÃO ADICIONADA AQUI:
    if (result.status === "error") {
        // Se a placa já existir, exibe o erro e não limpa o formulário
        alert("⚠️ " + result.message);
    } else {
        // Se der sucesso, avisa e limpa o formulário
        alert("Veículo cadastrado! ID: " + result.id);
        document.getElementById('form-veiculo').reset();
    }
    
    btn.innerText = "Salvar Veículo";
});


// --- Ordem de Serviço ---
let allClients = [];
let allVehicles = [];

async function initOS() {
    // Gerar Nº Randômico e Data
    document.getElementById('os-num').innerText = Math.floor(Math.random() * 90000) + 10000;
    const today = new Date();
    document.getElementById('os-data').innerText = today.toLocaleDateString('pt-BR');

    // Carregar Clientes
    const response = await fetch(`${APP_SCRIPT_URL}?action=getClients`);
    allClients = await response.json();
    
    const cliSelect = document.getElementById('os-cli-select');
    cliSelect.innerHTML = '<option value="">Selecione um Cliente</option>';
    allClients.forEach(c => {
        cliSelect.innerHTML += `<option value="${c.id}">${c.id} | ${c.nome}</option>`;
    });
}

async function fillClientData() {
    const id = document.getElementById('os-cli-select').value;
    const client = allClients.find(c => c.id === id);
    const printDiv = document.getElementById('os-cli-print');
    const veiSelect = document.getElementById('os-vei-select');

    if (client) {
        printDiv.innerHTML = `CPF: ${client.cpf} <br> Telefone: ${client.telefone} <br> Endereço: ${client.endereco}`;
        veiSelect.disabled = false;
        
        // Buscar veículos desse cliente
        const response = await fetch(`${APP_SCRIPT_URL}?action=getVehicles&clientId=${id}`);
        allVehicles = await response.json();
        
        veiSelect.innerHTML = '<option value="">Selecione um Veículo</option>';
        allVehicles.forEach(v => {
            veiSelect.innerHTML += `<option value="${v.id}">${v.id} | ${v.modelo} - ${v.placa}</option>`;
        });
    } else {
        printDiv.innerHTML = "Aguardando seleção...";
        veiSelect.disabled = true;
    }
}

function fillVehicleData() {
    const id = document.getElementById('os-vei-select').value;
    const vehicle = allVehicles.find(v => v.id === id);
    const printDiv = document.getElementById('os-vei-print');

    if (vehicle) {
        printDiv.innerHTML = `Marca: ${vehicle.marca} <br> Cor: ${vehicle.cor} <br> Ano: ${vehicle.ano}`;
    }
}

// --- Tabela Dinâmica de Itens ---
// Alteração na função addItem para incluir o botão de apagar
function addItem() {
    const tbody = document.getElementById('tbody-itens');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" class="item-desc" placeholder="Serviço/Peça"></td>
        <td><input type="number" class="item-qtd" value="1" min="1" oninput="calcRow(this)"></td>
        <td><input type="number" class="item-val" value="0.00" step="0.01" oninput="calcRow(this)"></td>
        <td><input type="text" class="item-total" value="0.00" readonly style="width:80px"></td>
        <td><button class="btn-delete" onclick="removeItem(this)">✕</button></td>
    `;
    tbody.appendChild(row);
}

// 3. Função para apagar a linha
function removeItem(btn) {
    if(confirm("Deseja remover este item?")) {
        btn.closest('tr').remove();
        calcTotaisGerais(); // Recalcula o financeiro após apagar
    }
}

function calcRow(el) {
    const row = el.closest('tr');
    const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
    const val = parseFloat(row.querySelector('.item-val').value) || 0;
    const total = qtd * val;
    row.querySelector('.item-total').value = total.toFixed(2);
    calcTotaisGerais();
}

function calcTotaisGerais() {
    let subtotal = 0;
    document.querySelectorAll('.item-total').forEach(input => {
        subtotal += parseFloat(input.value) || 0;
    });
    document.getElementById('os-subtotal').innerText = subtotal.toFixed(2);
    calcTotalGeral();
}

function calcTotalGeral() {
    const subtotal = parseFloat(document.getElementById('os-subtotal').innerText) || 0;
    const desc = parseFloat(document.getElementById('os-desconto').value) || 0;
    document.getElementById('os-total-geral').innerText = (subtotal - desc).toFixed(2);
}

async function saveOS() {
    const itens = [];
    document.querySelectorAll('#tbody-itens tr').forEach(row => {
        itens.push({
            servicoPeca: row.querySelector('.item-desc').value,
            qtd: row.querySelector('.item-qtd').value,
            valorUnit: row.querySelector('.item-val').value
        });
    });

    const data = {
        action: "saveOS",
        idCliente: document.getElementById('os-cli-select').value,
        idVeiculo: document.getElementById('os-vei-select').value,
        numOs: document.getElementById('os-num').innerText,
        data: document.getElementById('os-data').innerText,
        descricao: document.getElementById('os-descricao').value,
        desconto: document.getElementById('os-desconto').value,
        subtotal: document.getElementById('os-subtotal').innerText,
        totalGeral: document.getElementById('os-total-geral').innerText,
        itens: itens
    };

    if(!data.idCliente || !data.idVeiculo) {
        alert("Selecione o Cliente e o Veículo!");
        return;
    }

    const response = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    alert("Ordem de Serviço salva com sucesso!");
    clearOS();
}

function clearOS() {
    document.getElementById('os-cli-select').value = "";
    document.getElementById('os-vei-select').innerHTML = '<option value="">Selecione um Veículo</option>';
    document.getElementById('os-vei-select').disabled = true;
    document.getElementById('os-cli-print').innerHTML = "Aguardando seleção...";
    document.getElementById('os-vei-print').innerHTML = "Aguardando seleção...";
    document.getElementById('tbody-itens').innerHTML = "";
    document.getElementById('os-descricao').value = "";
    document.getElementById('os-desconto').value = "0";
    calcTotaisGerais();
    initOS(); // Regera número e data
}

function imprimirOS() {
    // 1. Identificar os IDs selecionados
    const clienteId = document.getElementById('os-cli-select').value;
    const veiculoId = document.getElementById('os-vei-select').value;

    if (!clienteId || !veiculoId) {
        alert("Por favor, selecione um Cliente e um Veículo antes de imprimir.");
        return;
    }

    // 2. Buscar os dados REAIS nos arrays (mais seguro que ler da tela)
    const cliente = allClients.find(c => c.id === clienteId);
    const veiculo = allVehicles.find(v => v.id === veiculoId);

    // 3. Preencher o Cabeçalho e Dados do Cliente [cite: 2, 3, 4, 5]
    document.getElementById('p-os-num').innerText = document.getElementById('os-num').innerText;
    document.getElementById('p-data').innerText = document.getElementById('os-data').innerText;
    document.getElementById('p-cliente').innerText = cliente.nome;
    document.getElementById('p-assinatura-cliente').innerText = cliente.nome;
    document.getElementById('p-tel').innerText = cliente.telefone;
    document.getElementById('p-endereco').innerText = cliente.endereco;
    
    // 4. Preencher Dados do Veículo [cite: 10]
    document.getElementById('p-veiculo').innerText = `${veiculo.placa} | ${veiculo.modelo}`;
    document.getElementById('p-desc').innerText = document.getElementById('os-descricao').value;

    // 5. Limpar e preencher a tabela de itens 
    const pItens = document.getElementById('p-itens');
    pItens.innerHTML = "";
    
    const linhasItens = document.querySelectorAll('#tbody-itens tr');
    if (linhasItens.length === 0) {
        pItens.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum item adicionado</td></tr>";
    } else {
        linhasItens.forEach(row => {
            const desc = row.querySelector('.item-desc').value;
            const qtd = row.querySelector('.item-qtd').value;
            const unit = row.querySelector('.item-val').value;
            const total = row.querySelector('.item-total').value;
            
            pItens.innerHTML += `
                <tr>
                    <td>${desc}</td>
                    <td style="text-align:center">${qtd}</td>
                    <td style="text-align:right">R$ ${parseFloat(unit).toFixed(2)}</td>
                    <td style="text-align:right">R$ ${parseFloat(total).toFixed(2)}</td>
                </tr>`;
        });
    }

    // 6. Preencher Resumo Financeiro [cite: 16]
    document.getElementById('p-subtotal').innerText = document.getElementById('os-subtotal').innerText;
    document.getElementById('p-desconto').innerText = document.getElementById('os-desconto').value;
    document.getElementById('p-total').innerText = document.getElementById('os-total-geral').innerText;

    // 7. Comando final de impressão
    setTimeout(() => {
        window.print();
    }, 500); // Pequeno atraso para garantir que o navegador "desenhou" os dados no template
}

// --- NAVEGAÇÃO DE ABAS ---
function abrirAba(evt, idAba) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idAba).style.display = 'block';
    evt.currentTarget.classList.add('active');
}

// --- MÁSCARAS E VALIDAÇÕES ---
function mudarMascaraCli() {
    const tipo = document.querySelector('input[name="busca-cli-tipo"]:checked').value;
    const input = document.getElementById('busca-cli-valor');
    input.value = '';
    
    if (tipo === 'CPF') {
        input.setAttribute('maxlength', '14');
        input.placeholder = "000.000.000-00";
        input.oninput = function() {
            let v = this.value.replace(/\D/g, "");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            this.value = v;
        };
    } else {
        input.removeAttribute('maxlength');
        input.placeholder = "Digite para buscar...";
        input.oninput = atualizarAutocompleteNomes;
    }
}

function mascaraPlacaBusca(input) {
    let v = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3);
    input.value = v;
}

// --- AUTOCOMPLETE DE NOMES ---
function atualizarAutocompleteNomes() {
    const lista = document.getElementById('lista-nomes-cli');
    lista.innerHTML = '';
    const digitado = document.getElementById('busca-cli-valor').value.toLowerCase();
    
    if (digitado.length > 0) {
        const nomesFiltrados = allClients.filter(c => c.nome.toLowerCase().includes(digitado));
        nomesFiltrados.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nome;
            lista.appendChild(opt);
        });
    }
}

// --- FUNÇÕES DE CONSULTA ---
function consultarCliente() {
    const tipo = document.querySelector('input[name="busca-cli-tipo"]:checked').value;
    // O .trim() remove espaços acidentais antes ou depois do texto
    const valor = document.getElementById('busca-cli-valor').value.trim(); 
    const res = document.getElementById('resultado-cli');
    
    if (valor === "") {
        res.innerHTML = "<p>Por favor, digite um Nome ou CPF para buscar.</p>";
        return;
    }

    // Busca ignorando maiúsculas e minúsculas
    let cliente = tipo === 'CPF' 
        ? allClients.find(c => c.cpf === valor) 
        : allClients.find(c => c.nome.toLowerCase().trim() === valor.toLowerCase());

    if (!cliente) {
        res.innerHTML = "<p>⚠️ Cliente não encontrado. Verifique se o nome/CPF está correto.</p>";
        return;
    }

    // Busca veículos vinculados (comparando ID com ID_CLIENTE)
    const veiculosDoCliente = allVehicles.filter(v => String(v.idCliente) === String(cliente.id));
    let htmlVeiculos = veiculosDoCliente.map(v => `<li>${v.marca} | ${v.modelo} | ${v.placa}</li>`).join('');

    res.innerHTML = `
        <p><strong>ID:</strong> ${cliente.id} <button class="btn-acao btn-copiar" onclick="copiarID('${cliente.id}')">📋 Copiar</button></p>
        <p><strong>Nome:</strong> ${cliente.nome}</p>
        <p><strong>CPF:</strong> ${cliente.cpf}</p>
        <p><strong>Telefone:</strong> ${cliente.telefone}</p>
        <p><strong>Endereço:</strong> ${cliente.endereco}</p>
        <button class="btn-acao btn-editar" onclick="editarCliente('${cliente.id}')">✏️ Editar Cliente</button>
        <button class="btn-acao btn-excluir" onclick="excluirCliente('${cliente.id}', '${cliente.nome}')">🗑️ Excluir Cliente e Veículos</button>
        
        <hr class="divisor-gradient">
        
        <h3>Veículos Vinculados:</h3>
        <ul>${htmlVeiculos || '<li>Nenhum veículo cadastrado.</li>'}</ul>
    `;
}

function consultarVeiculo() {
    const placaDigitada = document.getElementById('busca-vei-placa').value.trim().toUpperCase();
    const res = document.getElementById('resultado-vei');
    
    if (placaDigitada === "") {
        res.innerHTML = "<p>Por favor, digite uma placa.</p>";
        return;
    }

    // Força a comparação de placas em maiúsculo
    const veiculo = allVehicles.find(v => v.placa.trim().toUpperCase() === placaDigitada);

    if (!veiculo) {
        res.innerHTML = "<p>⚠️ Veículo não encontrado. Verifique a placa.</p>";
        return;
    }

    // Compara como texto (String) para evitar erros de tipagem
    const clienteVinculado = allClients.find(c => String(c.id) === String(veiculo.idCliente));
    const nomeCli = clienteVinculado ? clienteVinculado.nome : "Cliente Desconhecido (ID: " + veiculo.idCliente + ")";

    res.innerHTML = `
        <p><strong>Proprietário:</strong> ${nomeCli}</p>
        <p><strong>Marca:</strong> ${veiculo.marca} 
            <button class="btn-acao btn-editar" onclick="editarVeiculo('${veiculo.id}')">✏️</button>
            <button class="btn-acao btn-excluir" onclick="excluirVeiculo('${veiculo.id}')">🗑️</button>
        </p>
        <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
        <p><strong>Placa:</strong> ${veiculo.placa}</p>
        <p><strong>Cor:</strong> ${veiculo.cor}</p>
        <p><strong>Ano:</strong> ${veiculo.ano}</p>
    `;
}

function consultarOS() {
    const num = document.getElementById('busca-os-num').value;
    const res = document.getElementById('resultado-os');
    
    // Supondo que você tenha um array allOS carregado do banco
    const os = allOS.find(o => o.numOS === num || o.id === num); 

    if (!os) {
        res.innerHTML = "<p>O.S. não encontrada.</p>";
        return;
    }

    const clienteVinculado = allClients.find(c => c.id === os.idCliente);
    const nomeCli = clienteVinculado ? clienteVinculado.nome : "Cliente Desconhecido";

    res.innerHTML = `
        <p><strong>Nº O.S.:</strong> ${os.numOS || os.id} 
           <button class="btn-acao btn-editar" onclick="visualizarOSnaTela('${os.numOS || os.id}')">👁️ Visualizar O.S.</button>
        </p>
        <p><strong>Data:</strong> ${os.data}</p>
        <p><strong>Cliente:</strong> ${nomeCli}</p>
        <p><strong>Status:</strong> ${os.status}</p>
    `;
}

// --- FERRAMENTAS DE APOIO ---
function limparConsulta(aba) {
    if(aba === 'cli') {
        document.getElementById('busca-cli-valor').value = '';
        document.getElementById('resultado-cli').innerHTML = '';
    } else if(aba === 'vei') {
        document.getElementById('busca-vei-placa').value = '';
        document.getElementById('resultado-vei').innerHTML = '';
    } else if(aba === 'os') {
        document.getElementById('busca-os-num').value = '';
        document.getElementById('resultado-os').innerHTML = '';
    }
}

function copiarID(id) {
    navigator.clipboard.writeText(id).then(() => {
        alert("ID " + id + " copiado para a área de transferência!");
    });
}

function visualizarOSnaTela(numOS) {
    // Copia o conteúdo do seu template de impressão invisível e joga no modal pop-up
    const conteudoPrint = document.getElementById('print-template').innerHTML;
    document.getElementById('conteudo-visualizar-os').innerHTML = conteudoPrint;
    
    // Abre o modal sobreposto
    document.getElementById('modal-visualizar-os').style.display = 'block';
}

// Stubs para Edição e Exclusão (Para conectar com suas rotas do Google Apps Script depois)
function excluirCliente(id, nome) {
    if(confirm(`Tem certeza que deseja excluir o cliente ${nome} E TODOS OS SEUS VEÍCULOS? Esta ação não pode ser desfeita.`)) {
        alert("Comando de exclusão enviado para o banco (ID: " + id + ")");
        // Aqui entrará o fetch para o Google Script para deletar cliente e veículos
    }
}

function editarCliente(id) {
    // 1. Localiza o cliente na lista global pelo ID
    const cliente = allClients.find(c => String(c.id) === String(id));

    if (!cliente) {
        alert("Erro ao localizar dados do cliente para edição.");
        return;
    }

    // 2. Preenche os campos do formulário de Cadastro de Clientes
    // Certifique-se de que os IDs abaixo (cli-id, cli-nome, etc) são os mesmos do seu HTML
    document.getElementById('cli-id').value = cliente.id;
    document.getElementById('cli-nome').value = cliente.nome;
    document.getElementById('cli-cpf').value = cliente.cpf;
    document.getElementById('cli-telefone').value = cliente.telefone;
    document.getElementById('cli-endereco').value = cliente.endereco;

    // 3. Fecha o modal de consultas e abre o de cadastro
    fecharModal('modal-consultas');
    document.getElementById('modal-clientes').style.display = 'block';

    // 4. Dica visual: Altere o título do modal ou o texto do botão para "Salvar Alterações"
    // Isso ajuda a saber que você está editando, não criando um novo.
    const btnSalvar = document.querySelector('#modal-clientes .btn-salvar');
    if(btnSalvar) btnSalvar.innerText = "Atualizar Cadastro";
}

function excluirVeiculo(id) {
    if(confirm(`Tem certeza que deseja excluir este veículo?`)) {
        alert("Comando de exclusão do veículo enviado!");
    }
}
function editarVeiculo(id) {
    alert("Abrindo formulário com dados do veículo " + id);
}

function abrirNovoCliente() {
    // Limpa todos os campos
    document.getElementById('cli-id').value = '';
    document.getElementById('cli-nome').value = '';
    document.getElementById('cli-cpf').value = '';
    document.getElementById('cli-telefone').value = '';
    document.getElementById('cli-endereco').value = '';

    // Restaura o texto do botão
    const btnSalvar = document.querySelector('#modal-clientes .btn-salvar');
    if(btnSalvar) btnSalvar.innerText = "Salvar Cliente";

    document.getElementById('modal-clientes').style.display = 'block';
}