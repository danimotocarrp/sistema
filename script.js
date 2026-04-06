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