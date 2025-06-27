function adicionarUnidade() {

    const selectElement = document.getElementById('estabelecimento');
    const id_estabelecimento = selectElement.value;
    const estabelecimento = selectElement.options[selectElement.selectedIndex].text;

    if (!id_estabelecimento) {
        focusCampo('estabelecimento');
        Swal.fire({
            title: 'Erro',
            text: 'Selecione o estabelecimento',
            icon: 'error',
        });
        return;
    }

    const unidade = document.getElementById('unidade').value;
    if (!unidade) {
        focusCampo('unidade');
        Swal.fire({
            title: 'Erro',
            text: 'Informe a unidade',
            icon: 'error',
        });
        return;
    }

    // Envio via AJAX para a rota 'subgrupo_inserir'
    $.ajax({
        url: unidadeInserirUrl,
        type: 'POST',
        data: {
            id_estabelecimento: id_estabelecimento,
            unidade: unidade,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            if (response.success) {
                // Criar a nova linha
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td class="id_unidade" style="display:none;">${response.id}</td>
                    <td class="id_estabelecimento" style="display:none;">${id_estabelecimento}</td>
                    <td class="estabelecimento text-center">${estabelecimento}</td>
                    <td class="unidade text-center">${unidade}</td>
                    <td class="ativo text-center">
                        <input type="checkbox" class="form-check-input" disabled checked>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowUnidade(this)">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowUnidade(this)">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;

                // Adicionar a nova linha à tabela
                document.querySelector('#tbUnidades tbody').appendChild(newRow);

                // Exibir mensagem de sucesso
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Unidade adicionada com sucesso!',
                    icon: 'success',
                    timer: 3000,
                });

                // Limpar os campos do formulário
                document.getElementById('unidade').value = '';
            } else {
                Swal.fire({
                    title: 'Erro',
                    text: response.message || 'Não foi possível adicionar a unidade.',
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


function editRowUnidade(button) {
    const row = button.closest('tr'); // Obtém a linha correspondente ao botão clicado

    // Seleciona as células relevantes
    const estabelecimentoCell = row.querySelector('.estabelecimento');
    const unidadeCell = row.querySelector('.unidade'); // Certifique-se de usar 'unidadeCell' aqui
    const ativoCheckbox = row.querySelector('.ativo input');

    const estabelecimentoAtual = estabelecimentoCell.textContent.trim(); // Estabelecimento atual

    // Faz o fetch para obter os estabelecimentos
    fetch(obterEstabelecimentos)
        .then(response => response.json())
        .then(data => {
            const estabelecimentos = data.estabelecimentos; // Lista de objetos {id, conteudo}

            let selectHTML = `
                <select class="form-select form-select-sm" id="estabelecimento" name="estabelecimento" required>
                    <option value="" disabled selected hidden></option>
            `;

            // Adiciona cada estabelecimento como uma opção
            estabelecimentos.forEach(estabelecimento => {
                if (estabelecimentoAtual === estabelecimento.nome) {
                    selectHTML += `<option value="${estabelecimento.id}" selected>${estabelecimento.nome}</option>`;
                } else {
                    selectHTML += `<option value="${estabelecimento.id}">${estabelecimento.nome}</option>`;
                }
            });

            // Fecha o select
            selectHTML += `</select>`;

            // Atualiza o conteúdo da célula com o novo select
            estabelecimentoCell.innerHTML = selectHTML;

            // Atualiza a célula unidade com um campo de texto
            unidadeCell.innerHTML = `
                <input type="text" class="form-control form-control-sm" value="${unidadeCell.textContent.trim()}">
            `;

            // Habilita o checkbox
            ativoCheckbox.disabled = false;

            // Altera o botão para "Salvar"
            button.innerHTML = '<i class="fas fa-save"></i>';
            button.onclick = function () {
                saveRowUnidade(row, button);
            };
        })
        .catch(error => console.error('Erro ao buscar estabelecimentos:', error));
}


function saveRowUnidade(row, button) {
    // Captura o valor da célula id_unidade
    const idUnidadeCell = row.querySelector('.id_unidade');
    const id_unidade = idUnidadeCell ? idUnidadeCell.textContent.trim() : null;

    // Captura o valor do select para o estabelecimento
    const estabelecimentoSelect = row.querySelector('.estabelecimento select');
    const estabelecimento = estabelecimentoSelect ? estabelecimentoSelect.options[estabelecimentoSelect.selectedIndex].text : '';
    const id_estabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value.trim() : '';

    // Captura o campo de texto da unidade
    const unidadeInput = row.querySelector('.unidade input');
    const unidade = unidadeInput ? unidadeInput.value.trim() : '';

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

    if (!unidade) {
        Swal.fire({
            title: 'Erro',
            text: 'O campo "Unidade" não pode estar vazio!',
            icon: 'error',
        });
        unidadeInput.focus(); // Coloca o foco no campo pendência
        return;
    }

    // Realiza a requisição AJAX para atualizar no backend
    $.ajax({
        url: unidadeAtualizarUrl,
        type: 'POST',
        data: {
            id_unidade: id_unidade,
            id_estabelecimento: id_estabelecimento,
            unidade: unidade,
            ativo: ativo,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            Swal.fire({
                title: 'Sucesso',
                text: 'Unidade atualizada com sucesso!',
                icon: 'success',
                timer: 3000,
            });
            // Atualiza a tabela com os novos dados
            row.querySelector('.estabelecimento').textContent = estabelecimento;
            row.querySelector('.unidade').textContent = unidade;
            row.querySelector('.ativo input').disabled = true;
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro ao atualizar a unidade.',
                icon: 'error',
            });
        }
    });

    // Altera o botão de salvar de volta para editar
    button.innerHTML = '<i class="fas fa-edit"></i>';
    button.onclick = function () {
        editRowUnidade(button);
    };
}


function deleteRowUnidade(button) {
    // Obter a linha onde o botão foi clicado
    const row = button.closest('tr');
    const id_unidade = row.querySelector('.id_unidade').textContent.trim();
    const unidade = row.querySelector('.unidade').textContent.trim();

    // Exibir a confirmação de exclusão
    Swal.fire({
        title: 'Confirmação',
        text: `Tem certeza que deseja excluir a unidade "${unidade}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar a solicitação para exclusão via AJAX
            $.ajax({
                url: unidadeExcluirUrl, // Rota de exclusão
                type: 'POST',
                data: {
                    id_unidade: id_unidade,
                    csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                success: function (response) {
                    if (response.success) {
                        // Remover a linha da tabela
                        row.remove();
                        Swal.fire({
                            title: 'Sucesso',
                            text: 'Unidade excluída com sucesso!',
                            icon: 'success',
                            timer: 3000,
                        });
                    } else {
                        Swal.fire({
                            title: 'Erro',
                            text: response.message || 'Não foi possível excluir a unidade.',
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
