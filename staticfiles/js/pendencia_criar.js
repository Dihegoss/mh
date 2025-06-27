function CriarPendenciaProximo() {

    Swal.fire({
        title: 'Aguarde...',
        text: 'Preparando formulário',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const nr_atendimento_mv = document.getElementById('nr_atendimento_mv').value;
    const nr_paciente_mv = document.getElementById('nr_paciente_mv').value;
    const paciente_nome = document.getElementById('paciente_nome').value;
    
    if (!nr_atendimento_mv || !nr_paciente_mv || !paciente_nome) {
        Swal.close();
        Swal.fire({
            title: 'MHDigital',
            text: 'Informe o código do atendimento e clique em "Buscar Atendimento"',
            icon: 'error',
            allowOutsideClick: false // Garante que o usuário precise interagir para fechar
        });

        return;
    }
    
    const dt_nascimento = document.getElementById('dt_nascimento').value;
    const nome_mae = document.getElementById('nome_mae').value;
    const municipio_mv = document.getElementById('municipio_mv').value;
    const nr_cpf = document.getElementById('nr_cpf').value;
    const nr_cns = document.getElementById('nr_cns').value;
    const estabelecimento_mv = document.getElementById('estabelecimento_mv').value; 
    const nr_cnes = document.getElementById('nr_cnes').value;
    const unidade_mv = document.getElementById('unidade_mv').value; 
    const dt_hr_admissao_hospitalar = document.getElementById('dt_hr_admissao_hospitalar').value; 
    //const dt_previsao_alta = document.getElementById('dt_previsao_alta').value; 
    const dt_hr_alta_medica = document.getElementById('dt_hr_alta_medica').value; 
    const dt_hr_alta_hospitalar = document.getElementById('dt_hr_alta_hospitalar').value; 

    // Criando um formulário para enviar os dados
    let form = document.createElement('form');
    form.method = 'POST';
    form.action = '/pendencia/0/';  // Caminho para a view 'pendencia'

    // Adicionando os dados ao formulário
    form.appendChild(createHiddenInput('nr_atendimento_mv', nr_atendimento_mv));
    form.appendChild(createHiddenInput('nr_paciente_mv', nr_paciente_mv));
    form.appendChild(createHiddenInput('paciente_nome', paciente_nome));
    form.appendChild(createHiddenInput('dt_nascimento', dt_nascimento));
    form.appendChild(createHiddenInput('nome_mae', nome_mae));
    form.appendChild(createHiddenInput('municipio_mv', municipio_mv));
    form.appendChild(createHiddenInput('estabelecimento_mv', estabelecimento_mv));
    form.appendChild(createHiddenInput('nr_cpf', nr_cpf));
    form.appendChild(createHiddenInput('nr_cns', nr_cns));
    form.appendChild(createHiddenInput('nr_cnes', nr_cnes));
    form.appendChild(createHiddenInput('unidade_mv', unidade_mv));
    form.appendChild(createHiddenInput('dt_hr_admissao_hospitalar', dt_hr_admissao_hospitalar));
    //form.appendChild(createHiddenInput('dt_previsao_alta', dt_previsao_alta));
    form.appendChild(createHiddenInput('dt_hr_alta_medica', dt_hr_alta_medica));
    form.appendChild(createHiddenInput('dt_hr_alta_hospitalar', dt_hr_alta_hospitalar));
    
    form.appendChild(createHiddenInput('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value));

    // Submetendo o formulário
    document.body.appendChild(form);

    form.submit();

    setTimeout(() => {
        Swal.close();
    }, 5000); 
}

// Função para criar um input hidden
function createHiddenInput(name, value) {
    let input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    return input;
}

const selectElement = document.getElementById('score_de_charlson');
for (let i = 0; i <= 37; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    selectElement.appendChild(option);
}

function BuscarAtendimento() {
    const nr_atendimento_mv = document.getElementById('nr_atendimento_mv').value;

    $.ajax({
        url: buscarAtendimentoUrl,
        type: 'POST',
        data: {
            nr_atendimento_mv: nr_atendimento_mv,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        beforeSend: function () {
            // Mostrar loading enquanto a requisição está sendo processada
            Swal.fire({
                title: 'Aguarde...',
                text: 'Carregando informações do atendimento',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        },
        success: function (response) {
            if (response.success) {
                // Fechar o Swal.showLoading()
                Swal.close();

                // Preencher os campos com os dados retornados

                //********************* Bloco Identificação ********************************//
                document.getElementById('paciente_nome').value = response.paciente_nome;
                document.getElementById('nr_atendimento_mv').value = response.nr_atendimento_mv;
                document.getElementById('nr_paciente_mv').value = response.nr_paciente_mv;
                document.getElementById('nr_cpf').value = response.nr_cpf;
                document.getElementById('nr_cns').value = response.nr_cns;
                document.getElementById('dt_nascimento').value = response.dt_nascimento;
                document.getElementById('nome_mae').value = response.nome_mae;
                document.getElementById('municipio_mv').value = response.municipio_mv;
                document.getElementById('estabelecimento_mv').value = response.estabelecimento_mv;

                //********************* Bloco Internação ********************************//
                document.getElementById('nr_ddd_fone').value = response.nr_ddd_fone;
                document.getElementById('nr_ddd_celular').value = response.nr_ddd_celular;
                document.getElementById('nr_fone').value = response.nr_fone;
                document.getElementById('nr_fone_comercial').value = response.nr_fone_comercial;
                document.getElementById('nr_celular').value = response.nr_celular;
                document.getElementById('ds_endereco').value = response.ds_endereco;
                document.getElementById('nr_endereco').value = response.nr_endereco;
                document.getElementById('nm_bairro').value = response.nm_bairro;
                document.getElementById('ds_complemento').value = response.ds_complemento;
                document.getElementById('nr_cep').value = response.nr_cep;
                document.getElementById('cd_uf').value = response.cd_uf;
                document.getElementById('nr_cnes').value = response.nr_cnes;
                document.getElementById('nm_setor').value = response.nm_setor;
                document.getElementById('unidade_mv').value = response.unidade_mv;
                document.getElementById('nm_medico').value = response.nm_medico;
                document.getElementById('especialidade').value = response.especialidade;
                document.getElementById('dt_hr_admissao_hospitalar').value = response.dt_hr_admissao_hospitalar;
                document.getElementById('dt_previsao_alta').value = response.dt_previsao_alta;
                document.getElementById('dias_internacao').value = response. dias_internacao;
                document.getElementById('dt_hr_alta_medica').value = response.dt_hr_alta_medica;
                document.getElementById('dt_hr_alta_hospitalar').value = response.dt_hr_alta_hospitalar;

                //********************* Bloco Pendência ********************************//

                //********************* Bloco Comanejo ********************************//

                //********************* Bloco Alta ********************************//


            } else {
                // Exibir mensagem de erro
                Swal.fire({
                    title: 'Erro',
                    text: response.message || 'Não foi possível obter o atendimento.',
                    icon: 'error',
                    allowOutsideClick: false // Garante que o usuário precise interagir para fechar
                });
            }
        },
        error: function (response) {
            // Exibir mensagem de erro para falhas de comunicação
            Swal.fire({
                title: 'Erro',
                text: response.message,
                icon: 'error',
                allowOutsideClick: false // Garante que o usuário precise interagir para fechar
            });
        },
        complete: function () {
            // Não fechar o Swal automaticamente no `complete`
            // Remova o Swal.close() daqui
        }
    });
}