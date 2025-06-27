function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : null;
}

$(document).ready(function() {
    // Inicializa o Select2 no campo #CID
    $('#CID').select2({
        placeholder: "Digite para buscar...",
        allowClear: true,
        width: '100%'  // Ajusta o tamanho corretamente
    });
})

function copiarLinhasTabela(id_tabelaOrigem, id_tabelaDestino, id_pendencia_item='') {
    let tabelaOrigem = document.getElementById(id_tabelaOrigem);
    let tabelaDestino = document.getElementById(id_tabelaDestino);

    // Exclui todas as linhas da tabela de destino antes de copiar novas
    let linhasDestino = tabelaDestino.querySelectorAll("tbody tr");
    linhasDestino.forEach(function (linha) {
        linha.remove();
    });

    // Obtém todas as linhas da tabela de origem
    let linhasOrigem = tabelaOrigem.querySelectorAll("tbody tr");

    // Para cada linha da tabela de origem
    linhasOrigem.forEach(function (linhaOrigem) {
        let linhaClonada = linhaOrigem.cloneNode(true); // Clona a linha

        if (id_pendencia_item) {
            // Obtém a célula com o id_pendencia_item
            let celulaPendenciaItem = linhaClonada.querySelector("td#id_pendencia_item"); // Corrigido para 'modal_id_pendencia_item'

            if (celulaPendenciaItem) {
                id_pendencia_item_linha_clonada = celulaPendenciaItem.textContent.trim();
                if (id_pendencia_item_linha_clonada != id_pendencia_item) {
                    linhaClonada.style.display = "none"; // Oculta a linha se for diferente
                } else {
                    linhaClonada.style.display = ""; // Exibe a linha se for igual
                }
            };
        }
        else {
            linhaClonada.style.display = "";            
        }

        // Adiciona a linha clonada na tabela de destino
        tabelaDestino.querySelector("tbody").appendChild(linhaClonada);
    });
}

function CriarPendenciaProximo() {
    const nr_atendimento_mv = document.getElementById('nr_atendimento_mv').value;
    const nr_paciente_mv = document.getElementById('nr_paciente_mv').value;
    const paciente_nome = document.getElementById('paciente_nome').value;
    const dt_nascimento = document.getElementById('dt_nascimento').value;
    const nome_mae = document.getElementById('nm_mae').value;
    const municipio_mv = document.getElementById('municipio_mv').value;

    // Criando um formulário para enviar os dados
    let form = document.createElement('form');
    form.method = 'POST';
    form.action = '/pendencia/';  // Caminho para a view 'pendencia'

    // Adicionando os dados ao formulário
    form.appendChild(createHiddenInput('nr_atendimento_mv', nr_atendimento_mv));
    form.appendChild(createHiddenInput('nr_paciente_mv', nr_paciente_mv));
    form.appendChild(createHiddenInput('paciente_nome', paciente_nome));
    form.appendChild(createHiddenInput('dt_nascimento', dt_nascimento));
    form.appendChild(createHiddenInput('nome_mae', nome_mae));
    form.appendChild(createHiddenInput('municipio_mv', municipio_mv));
    form.appendChild(createHiddenInput('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value));

    // Submetendo o formulário
    document.body.appendChild(form);
    form.submit();
}

// Função para criar um input hidden
function createHiddenInput(name, value) {
    let input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    return input;
}

function SalvarPendencia() {
    let criada_ha_mais_de_48hrs = false;

    //Bloco Identificação
    var id_pendencia = document.getElementById('id_pendencia_id').value;
    var status_pendencia = document.getElementById('status_pendencia').value;  

    const dt_hr_criacao_pendencia_str = document.getElementById('dt_hr_criacao').value;

    if (dt_hr_criacao_pendencia_str && dt_hr_criacao_pendencia_str !== "None") {
        // Mapear nomes de meses para números (Janeiro = 0, Fevereiro = 1, ...)
        const meses = {
            "janeiro": 0, "fevereiro": 1, "março": 2, "abril": 3, "maio": 4, "junho": 5,
            "julho": 6, "agosto": 7, "setembro": 8, "outubro": 9, "novembro": 10, "dezembro": 11
        };
    
        // Extrair os componentes da string
        const partes = dt_hr_criacao_pendencia_str.split(" ");
        const dia = parseInt(partes[0], 10);
        const mes = meses[partes[2].toLowerCase()];
        const ano = parseInt(partes[4], 10);
        const [hora, minuto] = partes[6].split(":").map(n => parseInt(n, 10));
    
        // Criar o objeto Date
        const dt_hr_criacao_pendencia = new Date(ano, mes, dia, hora, minuto);
    
        // Calcular horas passadas desde a criação
        const agora = new Date();
        const horas_da_criacao_pendencia = (agora - dt_hr_criacao_pendencia) / (1000 * 60 * 60);
    
        // Verificar se passou de 48h
        if (horas_da_criacao_pendencia > 48) {
            criada_ha_mais_de_48hrs = true;
        }
    
        console.log("Criada há mais de 48h:", criada_ha_mais_de_48hrs);
    }
    

    var nomePaciente = document.getElementById('paciente_nome').innerText;
    var nr_cpf = document.getElementById('nr_cpf').innerText;
    var nr_cns = document.getElementById('nr_cns').innerText;
    var codigoAtendimento = document.getElementById('nr_atendimento_mv').innerText;
    var codigoPaciente = document.getElementById('nr_paciente_mv').innerText;
    var dataNascimento = document.getElementById('dt_nascimento').innerText;
    var nomeMae = document.getElementById('nome_mae').innerText;
    var municipio_mv = document.getElementById('municipio_mv').innerText;
    var estabelecimento = document.getElementById('estabelecimento_mv').innerText;

    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    //               Bloco Internação               \\
    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\

    // Campo `unidade_mv` (input text)
    const unidade_mv = document.getElementById('unidade_mv').value;

    // Campo `enfermeiro` (select)
    const enfermeiroSelect = document.getElementById('enfermeiro');
    const id_enfermeiro = enfermeiroSelect.value;
    const nome_enfermeiro = enfermeiroSelect.options[enfermeiroSelect.selectedIndex]?.text || "";
    if (!nome_enfermeiro) {
        focusCampo('enfermeiro');
        Swal.fire({
            title: c_App,
            text: 'Informe o(a) enfermeiro(a) do atendimento',
            icon: "error",
        });
        return;
    }

    // Campo `medico` (select)
    const medicoSelect = document.getElementById('medico');
    const id_medico = medicoSelect.value;
    const nome_medico = medicoSelect.options[medicoSelect.selectedIndex]?.text || "";
    if (!nome_medico) {
        focusCampo('medico');
        Swal.fire({
            title: c_App,
            text: 'Informe o(a) medico(a) do atendimento',
            icon: "error",
        });
        return;
    }

    // Campo `origem_paciente` (select)
    const origemPacienteSelect = document.getElementById('origem_paciente');
    const id_origemPaciente = origemPacienteSelect.value;
    const texto_origemPaciente = origemPacienteSelect.options[origemPacienteSelect.selectedIndex]?.text || "";
    if (!texto_origemPaciente) {
        focusCampo('origem_paciente');
        Swal.fire({
            title: c_App,
            text: 'Informe a origem do paciente',
            icon: "error",
        });
        return;
    }

    // Campo `motivo_admissao` (select)
    const motivoAdmissaoSelect = document.getElementById('motivo_admissao');
    const id_motivoAdmissao = motivoAdmissaoSelect.value;
    const texto_motivoAdmissao = motivoAdmissaoSelect.options[motivoAdmissaoSelect.selectedIndex]?.text || "";
    if (!texto_motivoAdmissao){
        focusCampo('motivo_admissao');
        Swal.fire({
            title: c_App,
            text: 'Informe o motivo de admissão',
            icon: "error",
        });
        return;        
    }

    // Campo `score_de_charlson` (select)
    const scoreCharlsonSelect = document.getElementById('score_de_charlson');
    const id_scoreCharlson = scoreCharlsonSelect.value;
    const texto_scoreCharlson = scoreCharlsonSelect.options[scoreCharlsonSelect.selectedIndex]?.text || "";
    if (criada_ha_mais_de_48hrs && !texto_scoreCharlson){
        focusCampo('score_de_charlson');
        Swal.fire({
            title: c_App,
            text: 'É obrigatório informar o escore de charlson para pendência registrada há mais de 48 horas',
            icon: "error",
        });
        return;        
    }

    // Campo `cuidados_paliativos` (select)
    const cuidadosPaliativosSelect = document.getElementById('cuidados_paliativos');
    const id_cuidadosPaliativos = cuidadosPaliativosSelect.value;
    const texto_cuidadosPaliativos = cuidadosPaliativosSelect.options[cuidadosPaliativosSelect.selectedIndex]?.text || "";
    if (!texto_cuidadosPaliativos){
        focusCampo('cuidados_paliativos');
        Swal.fire({
            title: c_App,
            text: 'Informe se há necessidade de cuidados paliativos',
            icon: "error",
        });
        return;        
    }    

    let now = new Date();

    // Campo `dt_hr_admissao_mh` (input datetime-local)
    const dtHrAdmissaoHospitalar = document.getElementById('dt_hr_admissao_hospitalar').value;

    // Campo `dt_hr_admissao_mh` (input datetime-local)
    const dtHrAdmissaoMH = document.getElementById('dt_hr_admissao_mh').value;
    let dtHrAdmissaoMH_DT = dtHrAdmissaoMH.split("T")[0];
    if (!dtHrAdmissaoMH) {
        focusCampo('dt_hr_admissao_mh');
        Swal.fire({
            title: c_App,
            text: 'Informe data/hora admissão na MH',
            icon: "error",
        });
        return;
    } else if (dtHrAdmissaoMH > now) {
        focusCampo('dt_hr_admissao_mh');
        Swal.fire({
            title: c_App,
            text: 'Data/Hora admissão na MH não pode ser no futuro',
            icon: "error",
        });
        return;
    }

    //Nenhuma informação de data inserida no sistema poderá ser menor que a data da admissão no MH (dtHrAdmissaoMH)

    // Campo `dt_previsao_alta` (input date)
    const previsaoAltaInicial = document.getElementById('dt_previsao_alta_inicial').value;
    const previsaoAlta = document.getElementById('dt_previsao_alta').value;
    if (criada_ha_mais_de_48hrs && !previsaoAlta){
        focusCampo('dt_previsao_alta');
        Swal.fire({
            title: c_App,
            text: 'É obrigatório informar a previsão de alta para pendência registrada há mais de 48 horas',
            icon: "error",
        });
        return;        
    }    

    if (previsaoAlta < dtHrAdmissaoMH_DT) {
        focusCampo('dt_previsao_alta');
        Swal.fire({
            title: c_App,
            text: 'Previsão de alta não pode ser menor que a data de admissão na MH',
            icon: "error",
        });
        return;        
    }


    // Campo `dias_internacao_hospitalar` (input text)
    const diasInternacaoHospitalar = document.getElementById('dias_internacao_hospitalar').value;

    // Campo `dias_internacao_mh` (input text)
    const diasInternacaoMH = document.getElementById('dias_internacao_mh').value;

    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    //                 Bloco Comanejo               \\
    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    // Selecionar a tabela pelo ID
    const tbComanejo = document.getElementById('tbComanejo');

    // Obter todas as linhas do corpo da tabela (tbody)
    const linhas = tbComanejo.querySelectorAll('tbody tr');
    const comanejo_sim_nao = document.getElementById('comanejo_sim_nao').value == "True";
    
    if (comanejo_sim_nao===true && linhas.length === 0){
        focusCampo('especialidade_comanejo');
        Swal.fire({
            title: c_App,
            text: 'Ao menos um comanejo deve ser informado',
            icon: "error",
        });
        return;        
    }  
    
    // Array para armazenar os dados
    const dadosTbComanejo = [];
    
    // Iterar sobre as linhas
    linhas.forEach((linha) => {
        // Verifica se a linha tem conteúdo visível
        const celulas = linha.querySelectorAll('td');
        const linhaVazia = Array.from(celulas).every((celula) => !celula.textContent.trim());
    
        if (linhaVazia) {
            // Ignora linhas sem conteúdo
            return;
        }
    
        // Busca os valores pelos IDs dos <td>
        const id_comanejo = linha.querySelector('td[id="id_comanejo"]')?.textContent.trim() || null;
        const id_especialidade_comanejo = linha.querySelector('td[id="id_especialidade_comanejo"]')?.textContent.trim() || null;
        const especialidadeComanejo = linha.querySelector('td[id="especialidade_comanejo"]')?.textContent.trim() || null;
        const dtAdmissaoComanejo = linha.querySelector('td[id="dt_admissao_comanejo"]')?.textContent.trim() || null;
        const dtSaidaComanejo = linha.querySelector('td[id="dt_saida_comanejo"]')?.textContent.trim() || null;

        // Adicionar os dados da linha como objeto ao array
        dadosTbComanejo.push({
            id_comanejo,
            id_especialidade_comanejo,
            especialidadeComanejo,
            dtAdmissaoComanejo,
            dtSaidaComanejo,
        });
    });
    
    
    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    //                Bloco Pendência               \\
    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    const tbPendenciaItensTable = document.getElementById("tbPendenciaItens");
    
    // Seleciona todas as linhas do corpo da tabela
    const tbPendenciaItens = tbPendenciaItensTable.querySelectorAll("tbody tr");
    
    // Array para armazenar os dados
    const dadostbPendenciaItens = [];
    
    // Itera sobre as linhas
    tbPendenciaItens.forEach(linha => {
        const id_pendencia_item = linha.querySelector('td[id="id_pendencia_item"]')?.textContent.trim() || null;
        const id_tp_pendencia = linha.querySelector('td[id="id_tp_pendencia"]')?.textContent.trim() || null;
        const tp_pendencia = linha.querySelector('td[id="tp_pendencia"]')?.textContent.trim() || null;
        const id_pendencia = linha.querySelector('td[id="id_pendencia"]')?.textContent.trim() || null;
        const pendencia = linha.querySelector('td[id="pendencia"]')?.textContent.trim() || null;
        const dt_hr_inicio_pendencia = linha.querySelector('td[id="dt_hr_inicio_pendencia"]')?.textContent.trim() || null;
        const dt_hr_encerramento_pendencia = linha.querySelector('td[id="dt_hr_encerramento_pendencia"]')?.textContent.trim() || null;
    
        // Adiciona os dados da linha ao array como um objeto
        if (id_tp_pendencia) {
            dadostbPendenciaItens.push({
                id_pendencia_item,
                id_tp_pendencia,
                tp_pendencia,
                id_pendencia,
                pendencia,
                dt_hr_inicio_pendencia,
                dt_hr_encerramento_pendencia
            });
        }
    });

    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    //    Acompanhamentos dos itens de pendência    \\
    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    const tbPendenciaItemAcompanhamentosTable = document.getElementById("tbPendenciaItemAcompanhamentos");
    
    // Seleciona todas as linhas do corpo da tabela
    const tbPendenciaItemAcompanhamentos = tbPendenciaItemAcompanhamentosTable.querySelectorAll("tbody tr");
    
    // Array para armazenar os dados
    const dadostbPendenciaItemAcompanhamentos = [];
    
    // Itera sobre as linhas
    tbPendenciaItemAcompanhamentos.forEach(linha => {
        const id_pendencia_item = linha.querySelector('td[id="id_pendencia_item"]')?.textContent.trim() || null;
        const id_pendencia_item_acompanhamento = linha.querySelector('td[id="id_pendencia_item_acompanhamento"]')?.textContent.trim() || null;
        const dt_hr_acompanhamento = linha.querySelector('td[id="dt_hr_acompanhamento"]')?.textContent.trim() || null;
        const usuario_acompanhamento = linha.querySelector('td[id="usuario_acompanhamento"]')?.textContent.trim() || null;
        const descricao_acompanhamento = linha.querySelector('td[id="descricao_acompanhamento"]')?.textContent.trim() || null;
        const status = linha.querySelector('td[id="status"]')?.textContent.trim() || null;
    
        dadostbPendenciaItemAcompanhamentos.push({
            id_pendencia_item,
            id_pendencia_item_acompanhamento,
            dt_hr_acompanhamento,
            usuario_acompanhamento,
            descricao_acompanhamento,
            status,
        });
    });    


    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    //                   Bloco Alta                 \\
    //////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\
    // Campo `Motivo da saída`
    const motivoSaidaSelect = document.getElementById("motivo_saida");
    const id_motivo_saida = motivoSaidaSelect.value; // O valor selecionado
    const texto_motivo_saida = motivoSaidaSelect.options[motivoSaidaSelect.selectedIndex]?.text || null; // O texto visível

    // Campo `CID`
    const CIDSelect = document.getElementById("CID");
    const id_cid = CIDSelect.value; // O valor selecionado
    const texto_cid = motivoSaidaSelect.options[motivoSaidaSelect.selectedIndex]?.text || null; // O texto visível

    // Campo `Setor`
    const setorSelect = document.getElementById("setor");
    const id_setor = setorSelect.value; // O valor selecionado
    const texto_setor = setorSelect.options[setorSelect.selectedIndex]?.text || null; // O texto visível

    // Campo `Data alta médica`
    const dtAltaMedicaInput = document.getElementById("dt_hr_alta_medica");
    const dtAltaMedicaValor = dtAltaMedicaInput.value; // O valor selecionado no formato 'yyyy-mm-dd'
    if (dtAltaMedicaValor && dtAltaMedicaValor < dtHrAdmissaoMH) {
        focusCampo('dt_hr_alta_medica');
        Swal.fire({
            title: c_App,
            text: 'Data da alta médica não pode ser menor que a data de admissão na MH',
            icon: "error",
        });
        return;        
    }    

    // Campo `Data alta hospitalar`
    const dtAltaHospitalarInput = document.getElementById("dt_hr_alta_hospitalar");
    const dtAltaHospitalarValor = dtAltaHospitalarInput.value; // O valor selecionado no formato 'yyyy-mm-dd'
    if (dtAltaHospitalarValor && dtAltaMedicaValor && dtAltaHospitalarValor < dtAltaMedicaValor) {
        focusCampo('dt_hr_alta_hospitalar');
        Swal.fire({
            title: c_App,
            text: 'Data da alta hospitalar não pode ser menor que a data da alta médica',
            icon: "error",
        });
        return;        
    }    
    
    if (dtAltaHospitalarValor && dtAltaHospitalarValor < dtHrAdmissaoMH) {
        focusCampo('dt_hr_alta_hospitalar');
        Swal.fire({
            title: c_App,
            text: 'Data da alta hospitalar não pode ser menor que a data de admissão na MH',
            icon: "error",
        });
        return;        
    }        

    // Envio via AJAX para a rota 'subgrupo_inserir'
    $.ajax({
        url: pendenciaSalvarUrl,
        type: 'POST',
        data: {
            //Dados do bloco de identificação
            status_pendencia        : status_pendencia,
            id_pendencia            : id_pendencia,
            nomePaciente            : nomePaciente,
            nr_cpf                  : nr_cpf,
            nr_cns                  : nr_cns,
            codigoAtendimento       : codigoAtendimento,
            codigoPaciente          : codigoPaciente,
            dataNascimento          : dataNascimento,
            nomeMae                 : nomeMae,
            municipio_mv            : municipio_mv,
            estabelecimento         : estabelecimento,

            //Dados do bloco de Internação
            unidade_mv              : unidade_mv,
            id_enfermeiro           : id_enfermeiro,
            id_medico               : id_medico,
            id_origemPaciente       : id_origemPaciente,
            id_motivoAdmissao       : id_motivoAdmissao,
            score_de_charlson       : texto_scoreCharlson,
            id_cuidadosPaliativos   : id_cuidadosPaliativos,
            previsaoAlta            : previsaoAlta,
            dataAdmissaoMH          : dtHrAdmissaoMH,
            dataAdmissaoHospitalar  : dtHrAdmissaoHospitalar,

            //Dados do bloco de Comanejo
            comanejo_sim_nao        : comanejo_sim_nao,
            comanejo_itens          : JSON.stringify(dadosTbComanejo),

            //Dados do bloco de Pendência
            pendencia_itens         : JSON.stringify(dadostbPendenciaItens),

            // Dados do bloco de Acompanhamentos
            acompanhamentos_itens   : JSON.stringify(dadostbPendenciaItemAcompanhamentos),

            //Dados do bloco de Alta
            id_motivoSaida          : id_motivo_saida,
            id_cid                  : id_cid,
            id_setor                : id_setor,
            dataHoraAltaMedica      : dtAltaMedicaValor,
            dataHoraAltaHospitalar  : dtAltaHospitalarValor,

            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            if (response.success) {
                // Exibir mensagem de sucesso
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Pendência gravada com sucesso!',
                    icon: 'success',
                }).then(() => {
                    // Redireciona para a página da pendência usando o ID retornado
                    window.location.href = `/pendencia/${response.id}/`;
                });
            } else {
                Swal.fire({
                    title: 'Erro',
                    text: response.message || 'Não foi possível gravar a pendência.',
                    icon: 'error',
                });
            }
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro na comunicação com o servidor.',
                icon: 'error',
            });
        }
    });
}

function FinalizarAtendimento() {

    if ( verificarCampos('Yes') === true ) {
        Swal.fire({
            title: c_App,
            icon: "question",
            iconHtml: "?",
            text: "Tem certeza que deseja finalizar o atendimento?",
            confirmButtonText: "Sim",
            cancelButtonText: "Não",
            showCancelButton: true,
            showCloseButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: c_App,
                    text: "Atendimento finalizado!",
                    showConfirmButton: false,
                    timer: 3500
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function () { 
    const tipoPendenciaElement = document.getElementById('id_tipo_pendencia');
    if (tipoPendenciaElement) {
        tipoPendenciaElement.addEventListener('change', function () {
            const tipoPendenciaId = this.value;
            const pendenciaSelect = document.getElementById('id_pendencia');
            
            pendenciaSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
            
            fetch(`/obterPendencias/${tipoPendenciaId}/`)
                .then(response => response.json())
                .then(data => {
                    pendenciaSelect.innerHTML = '<option value="" disabled selected>Selecione uma pendência</option>';
                    data.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = item.conteudo;
                        pendenciaSelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar as pendências:', error);
                    pendenciaSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar pendências</option>';
                });
        });
    } else {
        console.warn('Elemento id_tipo_pendencia não encontrado.');
    }
});


document.addEventListener('DOMContentLoaded', function () { 
    // Lógica para o campo "Tipo de Pendência" no modal
    const modalTipoPendenciaElement = document.getElementById('modalIdTpPendencia');
    if (modalTipoPendenciaElement) {
        modalTipoPendenciaElement.addEventListener('change', function () {
            const tipoPendenciaId = this.value;
            const modalPendenciaSelect = document.getElementById('modalPendencia');
            
            modalPendenciaSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
            
            fetch(`/obterPendencias/${tipoPendenciaId}/`)
                .then(response => response.json())
                .then(data => {
                    modalPendenciaSelect.innerHTML = '<option value="" disabled selected>Selecione uma pendência</option>';
                    data.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = item.conteudo;
                        modalPendenciaSelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar as pendências:', error);
                    modalPendenciaSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar pendências</option>';
                });
        });
    } else {
        console.warn('Elemento modalIdTpPendencia não encontrado.');
    }
});

document.getElementById('motivo_saida').addEventListener('change', function () {
    const setorSelect = document.getElementById('setor');
    const selectedValue = this.options[this.selectedIndex].text; // Obtém o texto selecionado
    
    // Verifica se o valor selecionado é "Transferência interna"
    if (selectedValue === "Transferência interna") {
        setorSelect.disabled = false; // Habilita o select
    } else {
        setorSelect.disabled = true;  // Desabilita o select
        setorSelect.value = ""; 
    }
});

function adicionarPendencia() {
    // Obter os valores dos campos do formulário
    const tipoPendenciaSelect = document.getElementById('id_tipo_pendencia');
    const pendenciaSelect = document.getElementById('id_pendencia');
    const dtHrPendenciaInput = document.getElementById('dt_hr_pendencia');

    const tipoPendenciaId = tipoPendenciaSelect.value;
    const tipoPendenciaTexto = tipoPendenciaSelect.options[tipoPendenciaSelect.selectedIndex].text;
    const pendenciaId = pendenciaSelect.value;
    const pendenciaTexto = pendenciaSelect.options[pendenciaSelect.selectedIndex].text;
    const dtHrPendencia = dtHrPendenciaInput.value;

    if (!tipoPendenciaId){
        focusCampo('id_tipo_pendencia');
        Swal.fire({
            title: c_App,
            text: 'Informe o tipo de pendência',
            icon: "error",
        });
        return;        
    }    

    if (!pendenciaId){
        focusCampo('id_pendencia');
        Swal.fire({
            title: c_App,
            text: 'Informe a pendência',
            icon: "error",
        });
        return;        
    }     
    
    const dtHrAdmissaoMH = document.getElementById('dt_hr_admissao_mh').value;

    let now = new Date();
    let dtHrPendencia_date = new Date(dtHrPendencia);

    if (!dtHrPendencia){
        focusCampo('dt_hr_pendencia');
        Swal.fire({
            title: c_App,
            text: 'Informe a data/hora início da pendência',
            icon: "error",
        });
        return;        
    }  else if (dtHrPendencia_date > now) {
        focusCampo('dt_hr_pendencia');
        Swal.fire({
            title: c_App,
            text: 'Data/Hora de início da pendência não pode ser no futuro',
            icon: "error",
        });
        return;
    } else if (dtHrAdmissaoMH && dtHrPendencia < dtHrAdmissaoMH) {
        focusCampo('dt_hr_pendencia');
        Swal.fire({
            title: c_App,
            text: 'Data/Hora de início da pendência não pode ser menor que a data de de admissão na MH',
            icon: "error",
        });
        return;
    }      

    // Formatar a data no padrão brasileiro (dd/MM/yyyy HH:mm)
    const dataFormatada = formatarDataBrasileira(dtHrPendencia);

    // Gerar um ID aleatório no formato "novo_XXXXXX"
    const idAleatorio = gerarIdAleatorio();

    // Criar uma nova linha na tabela
    const tabelas = document.getElementById('tbPendenciaItens').getElementsByTagName('tbody');
    const tabela = document.getElementById('tbPendenciaItens').getElementsByTagName('tbody')[0];
    const novaLinha = tabela.insertRow();

    // Adicionar as células na nova linha
    const cellIdPendenciaItem = novaLinha.insertCell(0);
    const cellIdTpPendencia = novaLinha.insertCell(1);
    const cellTpPendencia = novaLinha.insertCell(2);
    const cellIdPendencia = novaLinha.insertCell(3);
    const cellPendencia = novaLinha.insertCell(4);
    const cellDtHrInicioPendencia = novaLinha.insertCell(5);
    const cellDtHrEncerramentoPendencia = novaLinha.insertCell(6);
    const cellAcoes = novaLinha.insertCell(7);

    // Preencher as células com os valores
    cellIdPendenciaItem.innerHTML = idAleatorio; // Usar o ID aleatório gerado
    cellIdPendenciaItem.id = 'id_pendencia_item';
    cellIdPendenciaItem.style.display = 'none'; // Ocultar a célula

    cellIdTpPendencia.innerHTML = tipoPendenciaId;
    cellIdTpPendencia.id = 'id_tp_pendencia';
    cellIdTpPendencia.style.display = 'none'; // Ocultar a célula

    cellTpPendencia.innerHTML = `<small>${tipoPendenciaTexto}</small>`;
    cellTpPendencia.id = 'tp_pendencia';

    cellIdPendencia.innerHTML = pendenciaId;
    cellIdPendencia.id = 'id_pendencia';
    cellIdPendencia.style.display = 'none'; // Ocultar a célula

    cellPendencia.innerHTML = `<small>${pendenciaTexto}</small>`;
    cellPendencia.id = 'pendencia';

    cellDtHrInicioPendencia.innerHTML = `<small>${dataFormatada}</small>`;
    cellDtHrInicioPendencia.id = 'dt_hr_inicio_pendencia';
    cellDtHrEncerramentoPendencia.innerHTML = `<small></small>`; // Deixar vazio para ser preenchido posteriormente
    cellDtHrEncerramentoPendencia.id = 'dt_hr_encerramento_pendencia';

    // Adicionar botões de ação (editar e excluir)
    cellAcoes.innerHTML = `
        <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowPendenciaItem(this)">
            <i class="fas fa-edit"></i>
        </button>
    `;
    cellAcoes.classList.add('text-center');

    // Limpar os campos do formulário após adicionar
    tipoPendenciaSelect.value = '';
    pendenciaSelect.innerHTML = '<option value="" disabled selected>Primeiro selecione o tipo de pendência</option>';
    dtHrPendenciaInput.value = '';
}

function gerarIdAleatorio() {
    // Gerar um número aleatório entre 100000 e 999999
    const numeroAleatorio = Math.floor(Math.random() * 900000) + 100000;

    // Retornar o ID no formato "novo_XXXXXX"
    return `novo_${numeroAleatorio}`;
}

function converterParaFormatoDatetimeLocal(dataHora) {
    // Extrair partes da data e hora no formato "dd/MM/yyyy HH:mm"
    const [data, hora] = dataHora.split(' ');
    const [dia, mes, ano] = data.split('/');
    
    // Retornar no formato "yyyy-MM-ddTHH:mm"
    return `${ano}-${mes}-${dia}T${hora}`;
}

let selectedRow;

function editRowPendenciaItem(button) {
    //Limpa a table de acompanhamentos antes da abertura da tela de acompanhamentos
    const tbody = document.getElementById("tbPendenciaItemAcompanhamentos").querySelector("tbody");
    while (tbody.firstChild) { // Remove todas as linhas existentes no tbody
        tbody.removeChild(tbody.firstChild);
    }    

    // Obtém a linha associada ao botão clicado
    const row = button.closest("tr");
    selectedRow = row; //Guarda linha clicada para depois que voltar do modal na função saveEditPendencia

    // Obtém os valores das células na linha
    const id_pendencia_item = row.querySelector('#id_pendencia_item').innerText.trim();
    const id_tp_pendencia = row.querySelector('#id_tp_pendencia').innerText.trim();
    const tp_pendencia = row.querySelector('#tp_pendencia').innerText.trim();
    const id_pendencia = row.querySelector('#id_pendencia').innerText.trim();
    const pendencia = row.querySelector('#pendencia').innerText.trim();
    const dt_hr_inicio_pendencia = row.querySelector('#dt_hr_inicio_pendencia').innerText.trim();
    const dt_hr_encerramento_pendencia = row.querySelector('#dt_hr_encerramento_pendencia').innerText.trim();
    
    // Preenche os campos do modal com os valores obtidos
    document.getElementById("modalIdPendenciaItem").value = id_pendencia_item;
    document.getElementById("modalIdTpPendencia").value = tp_pendencia;
    document.getElementById("modalPendencia").value = pendencia;
    document.getElementById("modalDtHrInicio").value = dt_hr_inicio_pendencia;  // Preenche o campo de Data/Hora da Pendência
    document.getElementById("modalDtHrEncerramento").value = converterParaFormatoDatetimeLocal(dt_hr_encerramento_pendencia);

    copiarLinhasTabela("tbPendenciaItemAcompanhamentos_Inicial", "tbPendenciaItemAcompanhamentos", id_pendencia_item);

    const editPendenciaModal = new bootstrap.Modal(document.getElementById("editPendenciaModal"));
    editPendenciaModal.show();  
}

function fecharEditPendencia() {
    if (selectedRow) {
        const idPendenciaItem = document.getElementById("modalIdPendenciaItem").value;
        const dtHrEncerramento = document.getElementById("modalDtHrEncerramento").value;

        if (dtHrEncerramento) {
            const dtHrInicio = document.getElementById("modalDtHrInicio").value;
            const dtHrInicioFormatado = formatarDataParaInput(dtHrInicio);
            
            if (dtHrEncerramento < dtHrInicioFormatado) {
                focusCampo('modalDtHrEncerramento');
                Swal.fire({
                    title: c_App,
                    text: 'Data/Hora de encerramento da pendência não pode ser menor que data/hora de início da pendência',
                    icon: "error",
                });
                return;
            }
        }

        // Atualiza a linha na tabela principal
        selectedRow.querySelector('#dt_hr_encerramento_pendencia').innerText = formatarDataBrasileira(dtHrEncerramento);

        copiarLinhasTabela("tbPendenciaItemAcompanhamentos", "tbPendenciaItemAcompanhamentos_Inicial", '');        

        // Fecha o modal
        const editPendenciaModal = bootstrap.Modal.getInstance(document.getElementById("editPendenciaModal"));
        if (editPendenciaModal) {
            editPendenciaModal.hide();
        }
    }
}

// Função para obter o valor do option pelo texto
function getOptionValueByText(selectId, text) {
    const select = document.getElementById(selectId);
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text === text) {
            return select.options[i].value;
        }
    }
    return '';
}

// Converte data/hora do formato brasileiro para o formato ISO (inverso)
function formatarDataHoraInversa(dataHoraBR) {
    const [data, hora] = dataHoraBR.split(' ');
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}T${hora}`;
}

function formatarData(dataISO) {
    if (!dataISO) return ""; // Se estiver vazia, retorna string vazia

    let partes = dataISO.split("-");
    if (partes.length !== 3) return ""; // Se não tiver 3 partes, retorna vazio

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataInversa(dataISO) {
    if (!dataISO) return ""; // Se estiver vazia, retorna string vazia

    let partes = dataISO.split("/"); // ["18", "02", "2025"]
    return `${partes[2]}-${partes[1]}-${partes[0]}`; // "2025-02-18"
}

document.addEventListener('DOMContentLoaded', function() {
    // Obter o valor de id_tipo_pendencia
    const tipoPendencia = document.getElementById('id_tipo_pendencia').value;

    // Definir o valor selecionado no select modalIdTpPendencia
    const selectTipoPendencia = document.getElementById('modalIdTpPendencia');
    selectTipoPendencia.value = tipoPendencia;
});

async function adicionarAcompanhamento() {
    const descricaoAcompanhamento = document.getElementById('descricaoAcompanhamento');
    const id_pendencia_item = document.getElementById("modalIdPendenciaItem").value;
    const apelido = document.getElementById('modalApelido').value.trim();
    const tabela = document.getElementById("tbPendenciaItemAcompanhamentos").querySelector("tbody");
    const descricao = descricaoAcompanhamento.value.trim();

    // Verificar se a descrição está preenchida
    if (!descricao) {
        focusCampo('descricaoAcompanhamento');
        Swal.fire({
            title: "Erro",
            text: "Por favor, insira uma descrição para o acompanhamento.",
            icon: "error",
        });
        return;
    }

    // Obter data e hora atual do sistema
    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
    const segundos = String(dataAtual.getSeconds()).padStart(2, '0');
    const dataHoraFormatada = `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;

    // Criar uma nova linha para a tabela
    const novaLinha = document.createElement("tr");
    novaLinha.innerHTML = `
        <td id="id_pendencia_item" style="display:none;">${id_pendencia_item}</td>
        <td id="id_pendencia_item_acompanhamento" style="display:none;"></td>
        <td id="dt_hr_acompanhamento"><small>${dataHoraFormatada}</small></td>
        <td id="usuario_acompanhamento"><small>${apelido}</small></td>
        <td id="descricao_acompanhamento"><small>${descricao}</small></td>
        <td id="status" style="display:none;">Add</td>
    `;

    // Adicionar a nova linha à tabela
    tabela.insertBefore(novaLinha, tabela.firstChild);

    // Limpar o campo de descrição
    descricaoAcompanhamento.value = "";

    // Exibir mensagem de sucesso
    Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Acompanhamento adicionado",
        showConfirmButton: false,
        timer: 3000
      });
}

function adicionarComanejo() {
    // Captura os valores dos campos de entrada
    const especialidadeSelect = document.getElementById("especialidade_comanejo");
    const especialidade = especialidadeSelect.value; // Código da especialidade (ID)
    const especialidadeTexto = especialidadeSelect.options[especialidadeSelect.selectedIndex].text; // Texto visível
    // Verifica se todos os campos foram preenchidos
    if (!especialidade) {
        focusCampo('especialidade_comanejo');
        Swal.fire({
            title: c_App,
            text: 'Informe a especialidade do comanejo',
            icon: "error",
        });
        return;
    }

    const dtHrAdmissaoMH = document.getElementById('dt_hr_admissao_mh').value;
    let dtHrAdmissaoMH_DT = dtHrAdmissaoMH.split("T")[0];
    let now = new Date();
    const dtHrAdmissaoComanejo = document.getElementById("dt_admissao_comanejo").value;
    let dtHrAdmissaoComanejo_date = new Date(dtHrAdmissaoComanejo);
    if (!dtHrAdmissaoComanejo) {
        focusCampo('dt_admissao_comanejo');
        Swal.fire({
            title: c_App,
            text: 'Informe a data de admissão do comanejo',
            icon: "error",
        });
        return;
    } else if (dtHrAdmissaoComanejo_date > now) {
        focusCampo('dt_admissao_comanejo');
        Swal.fire({
            title: c_App,
            text: 'Data de admissão do comanejo não pode ser no futuro',
            icon: "error",
        });
        return;
    } else if (dtHrAdmissaoMH_DT && dtHrAdmissaoComanejo < dtHrAdmissaoMH_DT) {
        focusCampo('dt_admissao_comanejo');
        Swal.fire({
            title: c_App,
            text: 'Data de admissão do comanejo não pode ser menor que a data de de admissão na MH',
            icon: "error",
        });
        return;
    }    

    // Cria uma nova linha para a tabela
    const tabela = document.getElementById("tbComanejo").getElementsByTagName("tbody")[0];
    const novaLinha = tabela.insertRow();

    // Define um ID único para a linha (opcional, para referência futura)
    const idLinha = `linha_${Date.now()}`;
    novaLinha.id = idLinha;

    // Adiciona as células na nova linha
    const celulaIdComanejo = novaLinha.insertCell();
    const celulaIdEspecialidade = novaLinha.insertCell();
    const celulaEspecialidade = novaLinha.insertCell();
    const celulaDtHrAdmissao = novaLinha.insertCell();
    const celulaDtHrSaida = novaLinha.insertCell();
    const celulaAcoes = novaLinha.insertCell();

    // Define IDs únicos para as células
    celulaIdComanejo.id = 'id_comanejo';
    celulaIdEspecialidade.id = 'id_especialidade_comanejo';
    celulaEspecialidade.id = 'especialidade_comanejo';
    celulaDtHrAdmissao.id = 'dt_admissao_comanejo';
    celulaDtHrSaida.id = 'dt_saida_comanejo';

    let partes = dtHrAdmissaoComanejo.split("-"); // Divide em ["2025", "02", "12"]
    let dtHrAdmissaoFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`; 

    // Define o conteúdo das células
    celulaIdComanejo.style.display = "none"; // ID gerado dinamicamente (pode ser deixado vazio)
    celulaIdEspecialidade.style.display = "none"; // ID da especialidade
    celulaIdEspecialidade.innerText = especialidade; // Armazena o ID para futuras referências
    celulaEspecialidade.innerHTML = `<small>${especialidadeTexto}</small>`; // Mostra o texto da especialidade
    celulaDtHrAdmissao.innerHTML = `<small>${dtHrAdmissaoFormatada}</small>`;
    celulaDtHrSaida.innerHTML = '';
    celulaAcoes.className = "text-center";
    celulaAcoes.innerHTML = `
        <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowComanejo(this)">
            <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowComanejo(this)">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // Limpa os campos de entrada
    document.getElementById("especialidade_comanejo").value = "";
    document.getElementById("dt_admissao_comanejo").value = "";
}


// Função para formatar data no formato brasileiro
function formatarDataBrasileira(dataISO) {
    if (!dataISO) return '';

    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

function deleteRowComanejo(button) {
    // Remove a linha correspondente ao botão clicado
    const linha = button.parentElement.parentElement;
    linha.remove();
}

function editRowComanejo(button) {
    // Obtém a linha associada ao botão clicado
    const row = button.closest("tr");

    // Verifica se a linha já está no modo de edição
    const isEditing = row.classList.contains("editing");

    if (isEditing) {
        // Salva os valores editados
        saveRowComanejo(row, button);
    } else {
        // Transforma as células em campos editáveis
        row.classList.add("editing");

        // Substitui o conteúdo das células por inputs editáveis
        const especialidade = row.querySelector("#especialidade_comanejo");
        const dtAdmissao = row.querySelector("#dt_admissao_comanejo");
        const dtSaida = row.querySelector("#dt_saida_comanejo");

        //let dataBr = dtAdmissao.innerText.trim(); // "18/02/2025"
        //let partes = dataBr.split("/"); // ["18", "02", "2025"]
        //let dtAdmissaoFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`; // "2025-02-18"
        let dtAdmissaoFormatada = formatarDataInversa(dtAdmissao.innerText.trim());
        let dtSaidaFormatada = formatarDataInversa(dtSaida.innerText.trim());

        var selectElement = criarSelectDinamico('especialidade_comanejo', especialidade.innerText.trim()); 
        especialidade.innerHTML = '';
        especialidade.appendChild(selectElement);
        dtAdmissao.innerHTML = `<input type="date" class="form-control form-control-sm" value="${dtAdmissaoFormatada}">`;
        dtSaida.innerHTML = `<input type="date" class="form-control form-control-sm" value="${dtSaidaFormatada}">`;

        // Muda o botão para "Salvar"
        button.innerHTML = '<i class="fas fa-save"></i>';
        button.classList.remove("btn-edit");
        button.classList.add("btn-save");
    }
}

function saveRowComanejo(row, button) {
    // Recupera os valores editados
    const especialidadeSelect = row.querySelector("#especialidade_comanejo select");
    const especialidadeOption = especialidadeSelect.options[especialidadeSelect.selectedIndex];
    const textoEspecialidade = especialidadeOption.text
    const dtAdmissao = row.querySelector("#dt_admissao_comanejo input").value;
    const dtSaida = row.querySelector("#dt_saida_comanejo input").value;

    const dtHrAdmissaoMH = document.getElementById('dt_hr_admissao_mh').value;
    let dtHrAdmissaoMH_DT = dtHrAdmissaoMH.split("T")[0];    

    //Validações dos campos de data
    var dt_admissao_comanejo_Cell = row.querySelector("#dt_admissao_comanejo").querySelector("input");
    var dt_saida_comanejo_Cell = row.querySelector("#dt_saida_comanejo").querySelector("input");

    if (!dtAdmissao) {
        Swal.fire({
            title: c_App,
            text: 'Informe data de admissão comanejo',
            icon: "error",
        });
        return;
    } else if (dtAdmissao < dtHrAdmissaoMH_DT) {
        dt_admissao_comanejo_Cell.focus();
        Swal.fire({
            title: c_App,
            text: 'Data de admissão comanejo não pode ser menor que a data de admissão na MH',
            icon: "error",
        });
        return;
    }

    if (dtSaida) {
        if (dtAdmissao > dtSaida) {
            dt_saida_comanejo_Cell.focus();
            Swal.fire({
                title: c_App,
                text: 'Data de saída comanejo não pode ser menor que a data de admissão comanejo',
                icon: "error",
            });
            return;
        }
    }

    // Atualiza as células com os valores salvos - formatarDataBrasileira
    row.querySelector("#especialidade_comanejo").innerText = textoEspecialidade;
    row.querySelector("#dt_admissao_comanejo").innerText = formatarData(dtAdmissao);
    row.querySelector("#dt_saida_comanejo").innerText = formatarData(dtSaida);

    // Remove a classe de edição
    row.classList.remove("editing");

    // Muda o botão de volta para "Editar"
    button.innerHTML = '<i class="fas fa-edit"></i>';
    button.classList.remove("btn-save");
    button.classList.add("btn-edit");
}

function verificarCampos(onSave) {
    var so_visualizacao = document.getElementById("so_visualizacao").value.toLowerCase() === "true";
    
    // Seleciona todos os campos a serem desabilitados
    var fields = document.querySelectorAll("input, select, textarea, button:not(.btn-danger)"); 

    // Habilita ou desabilita com base no valor de so_visualizacao
    fields.forEach(function(field) {
        if (field.disabled) return;
        field.disabled = so_visualizacao;
    });
    

    var dtAltaMedica = document.getElementById("dt_hr_alta_medica").value;
    var dtAltaHospitalar = document.getElementById("dt_hr_alta_hospitalar").value;
    var motivoSaida = document.getElementById("motivo_saida").value;
    var tabela = document.getElementById("tbPendenciaItens");
    var linhas = tabela.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    var temPendencias = linhas.length > 0;
    var todasEncerradas = true;
    
    for (var i = 0; i < linhas.length; i++) {
        var dtEncerramento = linhas[i].querySelector("#dt_hr_encerramento_pendencia").textContent.trim();
        if (!dtEncerramento) {
            todasEncerradas = false;
            break;
        }
    }
    
    // Verifica se onSave é um evento (como um clique), ignorando nesses casos
    if (onSave === 'No') {
        if (dtAltaMedica && dtAltaHospitalar && motivoSaida && temPendencias && todasEncerradas) {
            document.getElementById("btn_finalizar").style.display = "block";
        } else {
            document.getElementById("btn_finalizar").style.display = "none";
        }
    } else {
        if (!dtAltaMedica) {
            focusCampo('dt_hr_alta_medica');
            Swal.fire({
                title: c_App,
                text: 'Informe a data da alta médica',
                icon: "error",
            });
            return false;
        }

        if (!dtAltaHospitalar) {
            focusCampo('dt_hr_alta_hospitalar');
            Swal.fire({
                title: c_App,
                text: 'Informe a data da alta hospitalar',
                icon: "error",
            });
            return false;
        }    
        
        if (!motivoSaida) {
            focusCampo('motivo_saida');
            Swal.fire({
                title: c_App,
                text: 'Informe o motivo de saída',
                icon: "error",
            });
            return false;
        }     

        if (!temPendencias) {
            Swal.fire({
                title: c_App,
                text: 'Nenhuma pendência cadastrada',
                icon: "error",
            });
            return false;
        }         

        if (!todasEncerradas) {
            Swal.fire({
                title: c_App,
                text: 'Todas as pendências devem ter data/hora de encerramento',
                icon: "error",
            });
            return false;
        }      
        
        // Campo `enfermeiro` (select)
        const enfermeiroSelect = document.getElementById('enfermeiro');
        const nome_enfermeiro = enfermeiroSelect.options[enfermeiroSelect.selectedIndex]?.text || "";
        if (!nome_enfermeiro) {
            focusCampo('enfermeiro');
            Swal.fire({
                title: c_App,
                text: 'Informe o(a) enfermeiro(a) do atendimento',
                icon: "error",
            });
            return false;
        }

        // Campo `medico` (select)
        const medicoSelect = document.getElementById('medico');
        const nome_medico = medicoSelect.options[medicoSelect.selectedIndex]?.text || "";
        if (!nome_medico) {
            focusCampo('medico');
            Swal.fire({
                title: c_App,
                text: 'Informe o(a) medico(a) do atendimento',
                icon: "error",
            });
            return false;
        }

        // Campo `origem_paciente` (select)
        const origemPacienteSelect = document.getElementById('origem_paciente');
        const texto_origemPaciente = origemPacienteSelect.options[origemPacienteSelect.selectedIndex]?.text || "";
        if (!texto_origemPaciente) {
            focusCampo('origem_paciente');
            Swal.fire({
                title: c_App,
                text: 'Informe a origem do paciente',
                icon: "error",
            });
            return false;
        }

        // Campo `motivo_admissao` (select)
        const motivoAdmissaoSelect = document.getElementById('motivo_admissao');
        const texto_motivoAdmissao = motivoAdmissaoSelect.options[motivoAdmissaoSelect.selectedIndex]?.text || "";
        if (!texto_motivoAdmissao){
            focusCampo('motivo_admissao');
            Swal.fire({
                title: c_App,
                text: 'Informe o motivo de admissão',
                icon: "error",
            });
            return false;        
        }

        // Campo `score_de_charlson` (select)
        const scoreCharlsonSelect = document.getElementById('score_de_charlson');
        const texto_scoreCharlson = scoreCharlsonSelect.options[scoreCharlsonSelect.selectedIndex]?.text || "";
        if (!texto_scoreCharlson){
            focusCampo('score_de_charlson');
            Swal.fire({
                title: c_App,
                text: 'Informe o escore de charlson',
                icon: "error",
            });
            return false;        
        }

        // Campo `cuidados_paliativos` (select)
        const cuidadosPaliativosSelect = document.getElementById('cuidados_paliativos');
        const texto_cuidadosPaliativos = cuidadosPaliativosSelect.options[cuidadosPaliativosSelect.selectedIndex]?.text || "";
        if (!texto_cuidadosPaliativos){
            focusCampo('cuidados_paliativos');
            Swal.fire({
                title: c_App,
                text: 'Informe se há necessidade de cuidados paliativos',
                icon: "error",
            });
            return false;        
        }    

        // Campo `dt_hr_admissao_mh` (input datetime-local)
        const dtHrAdmissaoMH = document.getElementById('dt_hr_admissao_mh').value;
        if (!dtHrAdmissaoMH){
            focusCampo('dt_hr_admissao_mh');
            Swal.fire({
                title: c_App,
                text: 'Informe data/hora admissão na MH',
                icon: "error",
            });
            return false;        
        }

        // Campo `dt_previsao_alta` (input date)
        const previsaoAlta = document.getElementById('dt_previsao_alta').value;
        if (!previsaoAlta){
            focusCampo('dt_previsao_alta');
            Swal.fire({
                title: c_App,
                text: 'Informar a previsão de alta',
                icon: "error",
            });
            return false;        
        }         
    }

    return true;
}

function toggleComanejo() {
    var select = document.getElementById("comanejo_sim_nao");
    var divsComanejo = document.getElementsByClassName("comanejo");

    for (var i = 0; i < divsComanejo.length; i++) {
        divsComanejo[i].style.display = (select.value === "True") ? "block" : "none";
    }
}

document.addEventListener("DOMContentLoaded", function() {
    toggleComanejo();
});


// Chama a função sempre que os campos forem alterados
document.getElementById("dt_hr_alta_medica").addEventListener("input", verificarCampos('No'));
document.getElementById("dt_hr_alta_hospitalar").addEventListener("input", verificarCampos('No'));

// Chama a função ao carregar a página para verificar o estado inicial
window.onload = verificarCampos('No');

function Cancelar() {
    window.location.href = urlHome;
};
