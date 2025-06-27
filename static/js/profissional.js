function adicionarProfissional() {
    const selectElementEstabelecimento = document.getElementById('estabelecimento');
    const id_estabelecimento = selectElementEstabelecimento.value;
    const estabelecimento = selectElementEstabelecimento .options[selectElementEstabelecimento.selectedIndex].text;

    if (!id_estabelecimento) {
        focusCampo('estabelecimento');
        Swal.fire({
            title: 'Erro',
            text: 'Selecione o estabelecimento',
            icon: 'error',
        });
        return;
    }

    const selectElementTpProfissional = document.getElementById('tp_profissional');
    const id_tp_profissional = selectElementTpProfissional.value;
    const tp_profissional = selectElementTpProfissional .options[selectElementTpProfissional.selectedIndex].text;

    if (!id_estabelecimento) {
        focusCampo('tp_profissional');
        Swal.fire({
            title: 'Erro',
            text: 'Selecione o estabelecimento',
            icon: 'error',
        });
        return;
    }

    const nome = document.getElementById('nome').value;
    if (!nome) {
        focusCampo('nome');
        Swal.fire({
            title: 'Erro',
            text: 'Informe o nome do profissional',
            icon: 'error',
        });
        return;
    }

    const cpf = document.getElementById('cpf').value;
    if (!cpf) {
        focusCampo('cpf');
        Swal.fire({
            title: 'Erro',
            text: 'Informe o cpf do profissional',
            icon: 'error',
        });
        return;
    }

    // Envio via AJAX para a rota 'subgrupo_inserir'
    $.ajax({
        url: ProfissionalInserirUrl,
        type: 'POST',
        data: {
            id_estabelecimento: id_estabelecimento,
            id_tp_profissional: id_tp_profissional,
            nome: nome,
            cpf: cpf,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            if (response.success) {

                // Criar a nova linha
                const newRow = document.createElement('tr');

                const cpfFormatado = formatarCPF(cpf);

                newRow.innerHTML = `
                    <td class="id_profissional" style="display:none;">${response.id}</td>
                    <td class="id_estabelecimento" style="display:none;">${id_estabelecimento}</td>
                    <td class="id_tp_profissional" style="display:none;">${id_tp_profissional}</td>
                    <td class="estabelecimento text-center">${estabelecimento}</td>
                    <td class="tp_profissional text-center">${tp_profissional}</td>
                    <td class="nome text-center">${nome}</td>
                    <td class="cpf text-center">${cpfFormatado}</td>
                    <td class="ativo text-center">
                        <input type="checkbox" class="form-check-input" disabled checked>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowProfissional(this)">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowProfissional(this)">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;

                // Adicionar a nova linha à tabela
                document.querySelector('#tbProfissionais tbody').appendChild(newRow);

                // Exibir mensagem de sucesso
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Profissional adicionado com sucesso!',
                    icon: 'success',
                    timer: 3000,
                });

                // Limpar os campos do formulário
                document.getElementById('estabelecimento').value = '';
                document.getElementById('tp_profissional').value = '';
                document.getElementById('nome').value = '';
                document.getElementById('cpf').value = '';
            } else {
                Swal.fire({
                    title: 'Erro',
                    text: response.message || 'Não foi possível adicionar o profissional.',
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


function editRowProfissional(button) {
    const row = button.closest('tr'); // Obtém a linha correspondente ao botão clicado

    // Seleciona as células relevantes
    const estabelecimentoCell = row.querySelector('.estabelecimento');
    const tpProfissionalCell = row.querySelector('.tp_profissional'); 
    const nomeCell = row.querySelector('.nome');
    const cpfCell = row.querySelector('.cpf');
    const ativoCheckbox = row.querySelector('.ativo input');

    const estabelecimentoAtual = estabelecimentoCell.textContent.trim();
    const tpProfissionalAtual = tpProfissionalCell.textContent.trim();

    // Realiza as duas requisições ao mesmo tempo
    Promise.all([
        fetch(obterEstabelecimentos).then(response => response.json()),
        fetch(obterTPsProfissional).then(response => response.json())
    ])
    .then(([dataEstabelecimentos, dataTPProfissionais]) => {
        // Atualiza os estabelecimentos
        const estabelecimentos = dataEstabelecimentos.estabelecimentos; // Lista de objetos {id, conteudo}
        let selectHTML = `
            <select class="form-select form-select-sm" id="estabelecimento" name="estabelecimento" required>
                <option value="" disabled selected hidden></option>
        `;
        estabelecimentos.forEach(estabelecimento => {
            if (estabelecimentoAtual === estabelecimento.nome) {
                selectHTML += `<option value="${estabelecimento.id}" selected>${estabelecimento.nome}</option>`;
            } else {
                selectHTML += `<option value="${estabelecimento.id}">${estabelecimento.nome}</option>`;
            }
        });
        selectHTML += `</select>`;
        estabelecimentoCell.innerHTML = selectHTML;

        // Atualiza os tipos de profissional
        const tp_profissionais = dataTPProfissionais.tp_profissionais; // Lista de objetos {id, conteudo}
        let tpSelectHTML = `
            <select class="form-select form-select-sm" id="tp_profissional" name="tp_profissional" required>
                <option value="" disabled selected hidden></option>
        `;
        tp_profissionais.forEach(tp_profissional => {
            if (tpProfissionalAtual === tp_profissional.conteudo) {
                tpSelectHTML += `<option value="${tp_profissional.id}" selected>${tp_profissional.conteudo}</option>`;
            } else {
                tpSelectHTML += `<option value="${tp_profissional.id}">${tp_profissional.conteudo}</option>`;
            }
        });
        tpSelectHTML += `</select>`;
        tpProfissionalCell.innerHTML = tpSelectHTML;

        // Atualiza os campos de nome e CPF
        nomeCell.innerHTML = `
            <input type="text" class="form-control form-control-sm" value="${nomeCell.textContent.trim()}">
        `;
        cpfCell.innerHTML = `
            <input type="text" class="form-control form-control-sm" value="${cpfCell.textContent.trim()}">
        `;

        // Habilita o checkbox
        ativoCheckbox.disabled = false;

        // Altera o botão para "Salvar"
        button.innerHTML = '<i class="fas fa-save"></i>';
        button.onclick = function () {
            saveRowProfissional(row, button);
        };
    })
    .catch(error => console.error('Erro ao buscar dados:', error));
}



function saveRowProfissional(row, button) {
    // Captura o valor da célula id_unidade
    const idProfissionalCell = row.querySelector('.id_profissional');
    const id_profissional = idProfissionalCell ? idProfissionalCell.textContent.trim() : null;

    // Captura o valor do select para o estabelecimento
    const estabelecimentoSelect = row.querySelector('.estabelecimento select');
    const estabelecimento = estabelecimentoSelect ? estabelecimentoSelect.options[estabelecimentoSelect.selectedIndex].text : '';
    const id_estabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value.trim() : '';

    // Captura o valor do select para o tipo profissional
    const tpProfissionalSelect = row.querySelector('.tp_profissional select');
    const tp_profissional = tpProfissionalSelect ? tpProfissionalSelect.options[tpProfissionalSelect.selectedIndex].text : '';
    const id_tp_profissional = tpProfissionalSelect ? tpProfissionalSelect.value.trim() : '';

    // Captura o campo de texto da nome
    const nomeInput = row.querySelector('.nome input');
    const nome = nomeInput ? nomeInput.value.trim() : '';

    const cpfInput = row.querySelector('.cpf input');
    const cpf = cpfInput ? cpfInput.value.trim() : '';

    // Captura o valor do checkbox de ativo
    const ativo = row.querySelector('.ativo input').checked;

    // Validação para campos obrigatórios
    if (!estabelecimento) {
        Swal.fire({
            title: 'Erro',
            text: 'O estabelecimento deve ser selecionado!',
            icon: 'error',
        });
        estabelecimentoSelect.focus(); // Coloca o foco no select de tipo de pendência
        return;
    }

    if (!tp_profissional) {
        Swal.fire({
            title: 'Erro',
            text: 'O tipo de profissional deve ser selecionado!',
            icon: 'error',
        });
        tpProfissionalSelect.focus(); // Coloca o foco no select de tipo de pendência
        return;
    }

    if (!nome) {
        Swal.fire({
            title: 'Erro',
            text: 'O campo "Nome do profissional" não pode estar vazio!',
            icon: 'error',
        });
        nomeInput.focus(); // Coloca o foco no campo pendência
        return;
    }

    if (!cpf) {
        Swal.fire({
            title: 'Erro',
            text: 'O campo "CPF do profissional" não pode estar vazio!',
            icon: 'error',
        });
        cpfInput.focus(); // Coloca o foco no campo pendência
        return;
    }

    // Realiza a requisição AJAX para atualizar no backend
    $.ajax({
        url: ProfissionalAtualizarUrl,
        type: 'POST',
        data: {
            id_profissional: id_profissional,
            id_estabelecimento: id_estabelecimento,
            id_tp_profissional: id_tp_profissional,
            nome: nome,
            cpf: cpf,
            ativo: ativo,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            Swal.fire({
                title: 'Sucesso',
                text: 'Profissional atualizado(a) com sucesso!',
                icon: 'success',
                timer: 3000,
            });
            // Atualiza a tabela com os novos dados
            row.querySelector('.estabelecimento').textContent = estabelecimento;
            row.querySelector('.tp_profissional').textContent = tp_profissional;
            row.querySelector('.nome').textContent = nome;
            row.querySelector('.cpf').textContent = cpf;
            row.querySelector('.ativo input').disabled = true;
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro ao atualizar o profissional.',
                icon: 'error',
            });
        }
    });

    // Altera o botão de salvar de volta para editar
    button.innerHTML = '<i class="fas fa-edit"></i>';
    button.onclick = function () {
        editRowProfissional(button);
    };
}


function deleteRowProfissional(button) {
    // Obter a linha onde o botão foi clicado
    const row = button.closest('tr');
    const id_profissional = row.querySelector('.id_profissional').textContent.trim();
    const nome = row.querySelector('.nome').textContent.trim();

    // Exibir a confirmação de exclusão
    Swal.fire({
        title: 'Confirmação',
        text: `Tem certeza que deseja excluir o(a) profissional "${nome}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar a solicitação para exclusão via AJAX
            $.ajax({
                url: ProfissionalExcluirUrl, // Rota de exclusão
                type: 'POST',
                data: {
                    id_profissional: id_profissional,
                    csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                success: function (response) {
                    if (response.success) {
                        // Remover a linha da tabela
                        row.remove();
                        Swal.fire({
                            title: 'Sucesso',
                            text: 'Profissional excluído(a) com sucesso!',
                            icon: 'success',
                            timer: 3000,
                        });
                    } else {
                        Swal.fire({
                            title: 'Erro',
                            text: response.message || 'Não foi possível excluir o(a) profissional.',
                            icon: 'error',
                        });
                    }
                },
                error: function (response) {
                    Swal.fire({
                        title: 'Erro',
                        text: response.message || 'Não foi possível comunicar com o servidor.',
                        icon: 'error',
                    });
                },
            });
        }
    });
}

// Captura o evento de mudança dos selects
document.getElementById('estabelecimento').addEventListener('change', filterTable);
document.getElementById('tp_profissional').addEventListener('change', filterTable);

function filterTable() {
    const estabelecimentoId = document.getElementById('estabelecimento').value;
    const tpProfissionalId = document.getElementById('tp_profissional').value;

    const rows = document.querySelectorAll('#tbProfissionais tbody tr');

    rows.forEach(row => {
        const idEstabelecimento = row.getAttribute('data-id-estabelecimento');
        const idTpProfissional = row.getAttribute('data-id-tp-profissional');

        // Verifica se a linha corresponde aos filtros aplicados
        const showRow = 
            (estabelecimentoId === "" || idEstabelecimento === estabelecimentoId) &&
            (tpProfissionalId === "" || idTpProfissional === tpProfissionalId);

        // Exibe ou oculta a linha
        row.style.display = showRow ? '' : 'none';
    });
}

// Evento para aplicar a máscara no campo input
document.getElementById("cpf").addEventListener("input", function (e) {
    e.target.value = mascaraCPF(e.target.value);
});